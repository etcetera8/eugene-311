import { observer } from "mobx-react-lite";
import type { FC } from "react";
import type { Controller } from "../viewmodels/controller.viewmodel";

interface Props {
    controller: Controller;
}

const DAY_SECONDS = 86400;

const formatDate = (unixDate: number) =>
    new Date(unixDate * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export const TimelapseControl: FC<Props> = observer(({ controller }) => {
    const range = controller.timeRange;
    if (!range) return null;

    const cursor = controller.timeCursor ?? range[1];

    return (
        <div className="timelapse">
            <div className="timelapse-date">
                {controller.timeCursor === null ? "All time" : formatDate(cursor)}
            </div>
            <div className="timelapse-controls">
                <button
                    type="button"
                    onClick={controller.isPlaying ? controller.pause : controller.play}
                    aria-label={controller.isPlaying ? "Pause time-lapse" : "Play time-lapse"}
                >
                    {controller.isPlaying ? "❚❚" : "▶"}
                </button>
                <input
                    type="range"
                    min={range[0]}
                    max={range[1]}
                    step={DAY_SECONDS}
                    value={cursor}
                    onChange={e => controller.scrubTo(Number(e.target.value))}
                    aria-label="Time-lapse date"
                />
                {controller.timeCursor !== null && (
                    <button type="button" onClick={controller.resetTime}>Reset</button>
                )}
            </div>
        </div>
    );
});
