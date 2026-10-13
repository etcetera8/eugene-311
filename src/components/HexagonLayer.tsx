import { HexagonLayer as DeckHexagonLayer } from "@deck.gl/aggregation-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useEffect, useState, type FC } from "react";
import { useControl, Popup } from "react-map-gl/maplibre";
import type { Controller, Point } from "../viewmodels/controller.viewmodel";

interface Props {
    data: Point[];
    controller: Controller;
}
type HexPoint = {
    index: number,
    latLong: number[],
    count: number,
}
export const HexagonLayer: FC<Props> = ({ data, controller }) => {
    const [selectedHex, setSelectedHex] = useState<HexPoint | null>(null);
    const [deckLoaded, setDeckLoaded] = useState(false);
    const [hasAnimated, sethasAnimated] = useState<Point[] | null>(null);
    const hasLoadedAndAnimated = deckLoaded && hasAnimated === data;

    useEffect(() => {
        setSelectedHex(null);
    }, [data]);

    useEffect(() => {
        if (!deckLoaded) return;
        const id = requestAnimationFrame(() => sethasAnimated(data));
        return () => cancelAnimationFrame(id);
    }, [deckLoaded, data]);

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
    }, [overlay, data, selectedHex, hasLoadedAndAnimated]);

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