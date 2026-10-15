import { HexagonLayer as DeckHexagonLayer } from "@deck.gl/aggregation-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useEffect, useState, type FC } from "react";
import { Popup, useControl } from "react-map-gl/maplibre";
import type { Controller, Point } from "../viewmodels/controller.viewmodel";
import { colorRangeForType } from "./hexColors";

interface Props {
    data: Point[];
    // Grow-in animation replays only when this changes, so time-lapse steps don't re-trigger it.
    growKey: unknown;
    // When set, keep the color/height scale from the full dataset instead of rescaling per step.
    lockDomain: boolean;
    controller: Controller;
}
type HexPoint = {
    index: number,
    latLong: number[],
    count: number,
}
export const HexagonLayer: FC<Props> = ({ data, growKey, lockDomain, controller }) => {
    const [selectedHex, setSelectedHex] = useState<HexPoint | null>(null);
    const [deckLoaded, setDeckLoaded] = useState(false);
    const [hasAnimated, sethasAnimated] = useState<unknown>(null);
    const [fullDomain, setFullDomain] = useState<[number, number] | null>(null);
    const hasLoadedAndAnimated = deckLoaded && hasAnimated === growKey;
    const domain = lockDomain ? fullDomain : null;
    const colorRange = colorRangeForType(controller.selectedType);

    useEffect(() => {
        setSelectedHex(null);
    }, [data]);

    useEffect(() => {
        if (!deckLoaded) return;
        const id = requestAnimationFrame(() => sethasAnimated(growKey));
        return () => cancelAnimationFrame(id);
    }, [deckLoaded, growKey]);

    const overlay = useControl(() => new MapboxOverlay({
        onLoad: () => setDeckLoaded(true),
        getTooltip: (data) =>  data.object && selectedHex == null ? `${controller.selectedType ?? "All Reports counts"}: ` +JSON.stringify(data.object.count) : null,
    }));

    useEffect(() => {
        overlay.setProps({
            layers: [
                new DeckHexagonLayer<Point>({
                    id: "requests-hexagons",
                    data,
                    getPosition: ([lng, lat]) => [lng, lat],
                    radius: 200,
                    colorRange,
                    colorDomain: domain,
                    elevationDomain: domain,
                    onSetElevationDomain: ([min, max]) => {
                        if (lockDomain) return;
                        setFullDomain(prev => prev?.[0] === min && prev?.[1] === max ? prev : [min, max]);
                    },
                    elevationScale: hasLoadedAndAnimated ? 4 : 0,
                    extruded: true,
                    pickable: true,
                    onClick: (data) => {
                        if (!data.object || !data.coordinate) return false;
                        setSelectedHex({ index: data.index, latLong: data.coordinate, count: data.object.count })
                        return false;
                    },
                    highlightedObjectIndex: selectedHex?.index ?? -1,
                    transitions: { elevationScale: hasLoadedAndAnimated ? { duration: 1200, easing: (t: number) => 1 - Math.pow(1 - t, 3) } : 0 },
                }),
            ],
        });
    }, [overlay, data, selectedHex, hasLoadedAndAnimated, colorRange, domain, lockDomain]);

    return selectedHex ?
        <Popup
            longitude={selectedHex.latLong[0]}
            latitude={selectedHex.latLong[1]}
            onClose={() => setSelectedHex(null)}
            closeOnClick={false}
        >
            {controller.selectedType ?? "All"}: {selectedHex.count}
        </Popup>
    : null;
}