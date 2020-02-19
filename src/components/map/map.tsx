import {
  Component,
  Element,
  Event,
  EventEmitter,
  Listen,
  Prop,
  h
} from "@stencil/core";
import { Component as GxComponent } from "../common/interfaces";
import {
  FeatureGroup,
  Marker,
  map as LFMap,
  tileLayer
} from "leaflet/dist/leaflet-src.esm";
import { parseCoords } from "../common/coordsValidate";

@Component({
  shadow: false,
  styleUrl: "map.scss",
  tag: "gx-map"
})
export class Map implements GxComponent {
  private map: LFMap;
  private markersList = [];
  private mapProviderApplied: string;
  private mapTypesProviders = {
    hybrid:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    satellite:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  };
  private MIN_ZOOM = 1;
  private RECOMMENDED_MAX_ZOOM = 20;
  private tileLayerApplied: tileLayer;
  @Element() element: HTMLGxMapElement;

  /**
   * The coord of initial center of the map.
   *
   */
  @Prop({ mutable: true }) center = "0, 0";

  /**
   * The map provider.
   * _Note: Currently, this property is for setting a custom map provider using an URL._
   *
   */
  @Prop() mapProvider: string;

  /**
   * Map type to be used.
   * _Note: If you set a map provider, the selected map type will be ignored._
   *
   */
  @Prop() mapType: "standard" | "satellite" | "hybrid" = "standard";

  /**
   * The max zoom level available in the map.
   * _Note: 20 is the best value to be used, only lower values are allowed. Is highly recommended to no change this value if you are not sure about the `maxZoom` supported by the map._
   */
  @Prop() readonly maxZoom: number = this.RECOMMENDED_MAX_ZOOM;

  /**
   * The initial zoom level in the map.
   *
   */
  @Prop({ mutable: true }) zoom = 1;

  /**
   * Emmits when the map is loaded.
   *
   */
  @Event() gxMapDidLoad: EventEmitter;

  /**
   * Emmits when the map is clicked and return click coords.
   *
   */
  @Event() mapClick: EventEmitter;

  @Listen("gxMapMarkerDidLoad")
  onMapMarkerDidLoad(event: CustomEvent) {
    const markerElement = event.target;
    const markerV = event.detail;

    if (this.map) {
      markerV.addTo(this.map);
    } else {
      this.element.addEventListener("gxMapDidLoad", () => {
        markerV.addTo(this.map);
      });
    }
    this.markersList.push(markerV);
    markerElement.addEventListener("gxMapMarkerDeleted", () => {
      this.onMapMarkerDeleted(markerV);
    });
  }

  private checkForMaxZoom() {
    return this.maxZoom || this.RECOMMENDED_MAX_ZOOM;
  }

  private fitBounds() {
    if (this.markersList.length > 1) {
      const markersGroup = new FeatureGroup(this.markersList);
      this.map.fitBounds(markersGroup.getBounds());
    } else if (this.markersList.length === 1) {
      const [marker] = this.markersList;
      const markerCoords = [marker._latlng.lat, marker._latlng.lng];
      this.map.setView(markerCoords, this.zoom);
    }
  }

  private getZoom() {
    return this.zoom > 0
      ? this.zoom < this.RECOMMENDED_MAX_ZOOM
        ? this.zoom
        : this.RECOMMENDED_MAX_ZOOM - 1
      : this.MIN_ZOOM;
  }

  private onMapMarkerDeleted(marker: Marker) {
    let i = 0;
    marker.remove();
    while (
      i <= this.markersList.length &&
      this.markersList[i]._leaflet_id !== marker._leaflet_id
    ) {
      i++;
    }
    if (i <= this.markersList.length) {
      this.markersList.splice(i, 1);
    } else {
      console.warn("There was an error in the markers list!");
    }
  }

  private selectingTypes(mapType) {
    const tileLayerToApply = tileLayer(mapType, {
      maxZoom: this.maxZoom
    });
    tileLayerToApply.addTo(this.map);
    this.mapProviderApplied = tileLayerToApply;
  }

  private setMapProvider() {
    if (this.mapProviderApplied) {
      this.tileLayerApplied.removeFrom(this.map);
    }
    if (this.mapProvider) {
      const tileLayerToApply = tileLayer(this.mapProvider, {
        maxZoom: this.maxZoom
      });
      tileLayerToApply.addTo(this.map);
      this.mapProviderApplied = this.mapProvider;
      this.tileLayerApplied = tileLayerToApply;
    } else {
      if (!this.mapType || this.mapType === "standard") {
        this.selectingTypes(this.mapTypesProviders.standard);
      } else {
        if (this.mapType === "hybrid") {
          this.selectingTypes(this.mapTypesProviders.hybrid);
        } else if (this.mapType === "satellite") {
          this.selectingTypes(this.mapTypesProviders.satellite);
        }
      }
    }
  }

  componentDidLoad() {
    const elementVar = this.element.querySelector(".gxMap");
    const coords = parseCoords(this.center);
    const maxZoom = this.checkForMaxZoom();
    if (coords !== null) {
      this.map = LFMap(elementVar).setView(
        coords,
        this.getZoom(),
        this.maxZoom
      );
    } else {
      console.warn(
        "GX warning: Can not read 'center' attribute, default center set (gx-map)",
        this.element
      );
      this.map = LFMap(elementVar).setView([0, 0], this.getZoom());
    }
    this.setMapProvider();
    this.map.setMaxZoom(maxZoom);
    this.fitBounds();
    this.gxMapDidLoad.emit(this);
    this.map.addEventListener("click", ev => {
      this.mapClick.emit(ev.latlng);
    });
  }

  componentDidUpdate() {
    const maxZoom = this.checkForMaxZoom();
    this.setMapProvider();
    this.map.setMaxZoom(maxZoom);
  }

  render() {
    return (
      <div class="gxMapContainer">
        <div class="gxMap" />
      </div>
    );
  }
}
