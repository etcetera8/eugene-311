import { useEffect, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";

interface Props {
    degreesPerSecond?: number;
    resumeAfterMs?: number;
}

const INTERACTION_EVENTS = ["mousedown", "touchstart", "wheel"] as const;

export const CameraOrbit: FC<Props> = ({ degreesPerSecond = 3, resumeAfterMs = 20000 }) => {
    const { current: mapRef } = useMap();

    useEffect(() => {
        if (!mapRef) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const map = mapRef.getMap();

        let frameId = 0;
        let resumeTimer = 0;
        let lastTime: number | null = null;

        const tick = (time: number) => {
            if (lastTime !== null) {
                map.setBearing(map.getBearing() + degreesPerSecond * (time - lastTime) / 1000);
            }
            lastTime = time;
            frameId = requestAnimationFrame(tick);
        };

        const start = () => {
            lastTime = null;
            frameId = requestAnimationFrame(tick);
        };

        const pause = () => {
            cancelAnimationFrame(frameId);
            clearTimeout(resumeTimer);
            resumeTimer = window.setTimeout(start, resumeAfterMs);
        };

        INTERACTION_EVENTS.forEach(event => map.on(event, pause));
        start();

        return () => {
            cancelAnimationFrame(frameId);
            clearTimeout(resumeTimer);
            INTERACTION_EVENTS.forEach(event => map.off(event, pause));
        };
    }, [mapRef, degreesPerSecond, resumeAfterMs]);

    return null;
};
