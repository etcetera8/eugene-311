import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from "maplibre-gl";
// Mbundle it explicitly for runtime loading
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import Map from "react-map-gl/maplibre";
import { Controller } from "../viewmodels/controller.viewmodel";
import { CameraOrbit } from "./CameraOrbit";
import { FilterSection } from "./FilterSection";
import { HexagonLayer } from "./HexagonLayer";
import { TimelapseControl } from "./TimelapseControl";

setWorkerUrl(maplibreWorkerUrl);

export const Main = observer(() => {
    const [controller] = useState(() => new Controller());

    useEffect(() => {
        controller.init();
    }, [controller]);

    return(
        <div id="main-content">
            <div className="filter-panel">
                <h1>Seattle 311 Map</h1>
                <FilterSection controller={controller} />
            </div>
            <Map
                initialViewState={{ longitude: -122.34, latitude: 47.60, zoom: 11, pitch: 45 }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
            >
                <CameraOrbit />
                {controller.hasData && (
                    <HexagonLayer
                        data={controller.filteredData}
                        growKey={controller.baseData}
                        lockDomain={controller.timeCursor !== null}
                        controller={controller}
                    />
                )}
            </Map>
            <TimelapseControl controller={controller} />
        </div>
    )
})
