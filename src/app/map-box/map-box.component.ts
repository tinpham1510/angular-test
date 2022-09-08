import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { MapService } from '../map.service';
import { GeoJson, FeatureCollection } from '../map';
import { environment } from 'src/environments/environment';
import { RulerControl } from 'mapbox-gl-controls';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
import { ApiService } from '../api.service';
import { Observable, Subject } from 'rxjs';

export interface ZoneCategory {
  name: string;
  description: string;
  colourCode: string;
  sites: Array<number>;
  isDefault?: boolean;
}

export interface GeoJSON {
  type: string;
  coordinates: Array<any>;
}

export interface Zone {
  name: string;
  description: string;
  floorId: number;
  zoneCategoryId: number;
  zoneCategory?: ZoneCategory;
  zoneType: string;
  geoJSON: GeoJSON;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Floor {
  siteId: number;
  name: string;
  zones: { [key: string]: Zone };
  levelNumber: number;
  defaultZoomLevel: number;
  defaultRotationDegrees: number;
  tag: string;
  floorplanImage: string;
  imageTopLeftCoordinate: Coordinates;
  imageTopRightCoordinate: Coordinates;
  imageBottomRightCoordinate: Coordinates;
  imageBottomLeftCoordinate: Coordinates;
}

@Component({
  selector: 'map-box',
  templateUrl: './map-box.component.html',
  styleUrls: ['./map-box.component.scss'],
})
export class MapBoxComponent implements OnInit {
  /// default settings
  map: mapboxgl.Map | any;
  style = 'mapbox://styles/mapbox/satellite-v9';
  lat = 37.75;
  lng = -122.41;
  mapMeasure = new RulerControl();

  mapDraw = new MapboxDraw({
    defaultMode: 'static',
    modes: Object.assign(
      {
        RotateMode: 'static',
      },
      MapboxDraw.modes
    ),
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: true,
    },
    styles: [
      // ACTIVE (being drawn)
      // polygon fill
      {
        id: 'gl-draw-polygon-fill',
        type: 'fill',
        paint: {
          'fill-color': '#D20C0C',
          'fill-outline-color': '#D20C0C',
          'fill-opacity': 0.1,
        },
      },
      // polygon outline stroke
      // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
      {
        id: 'gl-draw-polygon-stroke-active',
        type: 'line',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#D20C0C',
          'line-dasharray': [0.2, 2],
          'line-width': 3,
        },
      },
      // vertex points
      {
        id: 'gl-draw-polygon-and-line-vertex-active',
        type: 'circle',
        paint: {
          'circle-radius': 6,
          'circle-color': '#D20C0C',
        },
      },
    ],
  });

  floorCreateObj = {
    tag: '',
    imageBottomLeftCoordinate: {
      latitude: 0,
      longitude: 0,
    },
    imageBottomRightCoordinate: {
      latitude: 0,
      longitude: 0,
    },
    imageTopLeftCoordinate: {
      latitude: 0,
      longitude: 0,
    },
    imageTopRightCoordinate: {
      latitude: 0,
      longitude: 0,
    },
    zones: {},
    floorplanImage:
      'https://s3-eu-west-1.amazonaws.com/production-critical-files/transparent.png',
    levelNumber: 0,
    defaultRotationDegrees: 0,
    defaultZoomLevel: 0,
    name: '',
    siteId: 1,
  };

  dataFloor = {
    allSiteByBrand: [],
    brandName: '',
    groups: {},
    mapLogoUrl: '',
    siteNotGroup: {},
  };

  address = {
    dptExclusions: '',
    latitude: 0,
    longitude: 0,
    name: '',
    siteId: 0,
  };

  imageUrl = '';

  button = '';

  detailFloor = {
    floors: {},
  };

  detail!: { [key: string]: {} };

  returnedZoneArray!: {
    [key: string]: Zone;
  };

  zoneCreateObj!: Zone;

  ground: Floor = {
    siteId: 0,
    name: '',
    zones: {},
    levelNumber: 0,
    defaultZoomLevel: 0,
    defaultRotationDegrees: 0,
    tag: '',
    floorplanImage: '',
    imageTopLeftCoordinate: { latitude: 0, longitude: 0 },
    imageTopRightCoordinate: { latitude: 0, longitude: 0 },
    imageBottomRightCoordinate: { latitude: 0, longitude: 0 },
    imageBottomLeftCoordinate: { latitude: 0, longitude: 0 },
  };
  constructor(private apiService: ApiService, private http: HttpClient) {}
  ngOnInit() {
    this.buildMap();
    const token =
      'eyJraWQiOiJIK3VScTAzY0g5SUxnUDRnNkhNYjl6WWNSNHJyQk5UNGRKaTFKYlV6YWFRPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1ODBiZTExNC1hZTFkLTQ2NjQtODIzNy1hMDEyMjJkNDcxNmIiLCJhdWQiOiI3Z3ZhNzduYXF0a2sxZzQwZm8yajFkZXYwcSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6IjBhYjY3OTE3LTNmZjItNGU3Ny1hYWNhLTYzODViMmM1ODRmYyIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNjYyNjAyODEwLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV82aUU0SkllUTAiLCJjb2duaXRvOnVzZXJuYW1lIjoiNTgwYmUxMTQtYWUxZC00NjY0LTgyMzctYTAxMjIyZDQ3MTZiIiwiZXhwIjoxNjYyNjA2NDEwLCJpYXQiOjE2NjI2MDI4MTAsImVtYWlsIjoibGluaEBsaW1pdGxlc3NpbnNpZ2h0LmNvbSJ9.WqNvcjvKXe9xQERAkJSf7NrCRgkkhuex3bwTxf-oB1_89xd97HHgOVPs1SSwWdNdZG2U4MPkmfRY-7XTb7F7ozpdZ0HRN97CSKRPeySXjH4DAVv32NO2b-zNLAceCLGcsYMsy22-2X7tzTE6tszC8u4SYJne-J_3ykItzpS0Yja4hKQ9RQu2gZq7-tkPge7i5fyjEW3ZQHf4kTu6niGGllPJlOYcZR-lYYGy4gmmN3ECwEM3kGzsRtonxoOXlExXvathsrxoqu0CzRY1rXfvo6OIgOIR_WF8mqon6S91wknQ5m-PC8DfdLMxxgyessO57Pcf-4zjRRewQwTk0zmuyQ';
    this.http
      .get('https://api.limitlessinsights.com/dashboard/dev/brands/1/sites', {
        headers: {
          'Content-type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
      })
      .subscribe((res) => {
        this.dataFloor = Object.assign(res);
        this.address = this.dataFloor.allSiteByBrand[0];
        this.map.setCenter([this.address.longitude, this.address.latitude]);
      });

    this.http
      .get('https://api.limitlessinsights.com/dashboard/dev/sites/242/floors', {
        headers: {
          'Content-type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
      })
      .subscribe((res) => {
        this.detailFloor = Object.assign(res);
        this.detail = this.detailFloor.floors;
        this.ground = this.detail[269] as Floor;
        this.map.setZoom(this.ground.defaultZoomLevel);
        this.imageUrl = this.ground.floorplanImage;
      });
  }

  buildMap() {
    (mapboxgl as any).accessToken = environment.mapbox.accessToken;
    this.map = new mapboxgl.Map({
      container: 'map',
      style: this.style,
      zoom: 12,
      center: [this.lng, this.lat],
    });
    // Add map controls

    this.map.addControl(new mapboxgl.FullscreenControl());
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    this.map.on(
      'mousemove',
      'ap-layer',
      function (e: { point: { x: string; y: string } }) {}
    );

    this.map.addControl(this.mapMeasure, 'top-right');
  }

  changeMode(event: any) {
    if (event.target.id === 'button1') {
      this.address = this.dataFloor.allSiteByBrand[1];
      this.map.setCenter([this.address.longitude, this.address.latitude]);
      this.map.setZoom(18);
      this.imageUrl = this.dataFloor.mapLogoUrl;
    } else if (event.target.id === 'button2') {
      this.address = this.dataFloor.allSiteByBrand[2];
      this.map.setCenter([this.address.longitude, this.address.latitude]);
      this.map.setZoom(18);
      this.imageUrl = this.dataFloor.mapLogoUrl;
    } else {
      this.address = this.dataFloor.allSiteByBrand[3];
      this.map.setCenter([this.address.longitude, this.address.latitude]);
      this.map.setZoom(18);
      this.imageUrl = this.dataFloor.mapLogoUrl;
    }
  }

  resetSites() {
    /*   this.address = this.dataFloor.allSiteByBrand[0];
    this.map.setCenter([this.address.longitude, this.address.latitude]);
    this.map.setZoom(18);
    this.imageUrl = this.dataFloor.mapLogoUrl; */
    this.returnedZoneArray;
    this.returnedZoneArray = this.ground.zones;
    console.log(this.returnedZoneArray[446].geoJSON.coordinates[0][0]);
    this.zoneCreateObj.geoJSON.coordinates = [
      this.returnedZoneArray[446].geoJSON.coordinates[0],
    ];
  }

  /* highlightZoneOnSideBar() {
    this.map.getCanvas().style.cursor = 'pointer';

    // New Array for Mouse Coordinates.
    const xy = new Array();
    // Get div 'x' value from DOM.
    const x = Number(document.getElementById('x')?.innerText);
    // Push to xy array.
    xy.push(x);
    // Get div 'y' value from DOM.
    const y = Number(document.getElementById('y')?.innerText);
    // Push to xy array.
    xy.push(y);
    // Query polygons at coordinates 'xy' on 'zones-layer'.
    const feature = this.map.queryRenderedFeatures(xy, {
      layers: ['zones-layer'],
    });
    // Set variables 'highlightedZone' to be Polygon property 'id'.
  } */
}
