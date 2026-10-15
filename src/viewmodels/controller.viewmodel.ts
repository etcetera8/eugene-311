import { makeAutoObservable, observableRef, runInAction } from "mobx";

export type RawPoint = [longitude: number, latitude: number, typeIndex: number, unixDate: number];
export type CityData = {
    types: string[],
    points: RawPoint[]
}
export type Point = [longitude: number, latitude: number, type: string, unixDate: number];

export const ALL = "All";

const TIMELAPSE_STEPS = 200;
const TIMELAPSE_STEP_MS = 80;

export class Controller {
    pointsByYear: Record<string, Point[]> = {};
    types: string[] = [];
    selectedType: string | null = null;
    selectedYears: string[] = [];
    timeCursor: number | null = null;
    isPlaying = false;
    private playTimer = 0;

    constructor() {
        makeAutoObservable<this, "playTimer">(this, { pointsByYear: observableRef, types: observableRef, playTimer: false }, { autoBind: true });
    }

    // Points matching the type/year filters, sorted by date.
    get baseData(): Point[] {
        const points = this.selectedYears.length
            ? [...this.selectedYears].sort().flatMap(year => this.pointsByYear[year] ?? [])
            : this.pointsByYear[ALL] ?? [];
        return this.selectedType ? points.filter(x => x[2] === this.selectedType) : points;
    }

    get filteredData(): Point[] {
        const data = this.baseData;
        if (this.timeCursor === null) return data;
        return data.slice(0, this.countUpTo(data, this.timeCursor));
    }

    get timeRange(): [number, number] | null {
        const data = this.baseData;
        return data.length ? [data[0][3], data[data.length - 1][3]] : null;
    }

    get years(): string[] {
        return Object.keys(this.pointsByYear).filter(x => x !== ALL);
    }

    get hasData(): boolean {
        return (this.pointsByYear[ALL]?.length ?? 0) > 0;
    }

    init() {
        this.fetchData();
    }

    setType(type: string | null) {
        this.resetTime();
        this.selectedType = type || null;
    }

    setYears(years: string[]) {
        this.resetTime();
        this.selectedYears = years;
    }

    play() {
        const range = this.timeRange;
        if (!range || this.isPlaying) return;
        if (this.timeCursor === null) this.timeCursor = range[0];
        this.isPlaying = true;
        this.playTimer = window.setInterval(this.step, TIMELAPSE_STEP_MS);
    }

    pause() {
        clearInterval(this.playTimer);
        this.isPlaying = false;
    }

    scrubTo(unixDate: number) {
        this.pause();
        this.timeCursor = unixDate;
    }

    resetTime() {
        this.pause();
        this.timeCursor = null;
    }

    private step() {
        const range = this.timeRange;
        if (!range || this.timeCursor === null) return this.resetTime();
        const next = this.timeCursor + (range[1] - range[0]) / TIMELAPSE_STEPS;
        if (next >= range[1]) return this.resetTime();
        this.timeCursor = next;
    }

    // Data must be sorted by date.
    private countUpTo(data: Point[], unixDate: number) {
        let lo = 0, hi = data.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (data[mid][3] <= unixDate) lo = mid + 1; else hi = mid;
        }
        return lo;
    }

    private fetchData() {
        fetch(`${import.meta.env.BASE_URL}requests.json`)
            .then((res) => res.json())
            .then((cityData: CityData) => runInAction(() => {
                this.types = [...cityData.types];
                this.pointsByYear = this.groupByYear(this.mapData(cityData));
            }))
            .catch((e) => console.error("Error fetching data", { e }));
    }

    private mapData({ types, points }: CityData): Point[] {
        return points
            .map(([lng, lat, typeIndex, unixDate]): Point => [lng, lat, types[typeIndex], unixDate])
            .sort((a, b) => a[3] - b[3]);
    }

    private parseYear(unixDate: number) {
        return new Date(unixDate * 1000).getUTCFullYear().toString();
    }

    private groupByYear(points: Point[]): Record<string, Point[]> {
        const grouped: Record<string, Point[]> = { [ALL]: points };
        for (const point of points) {
            (grouped[this.parseYear(point[3])] ??= []).push(point);
        }
        return grouped;
    }
}
