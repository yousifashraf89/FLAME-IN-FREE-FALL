import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, RadarChart, ScatterChart } from "echarts/charts";
import { GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, RadarComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([BarChart, LineChart, RadarChart, ScatterChart, GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, RadarComponent, TooltipComponent, CanvasRenderer]);

export type Opt = echarts.EChartsCoreOption;

// chart chrome tokens (dataviz: recessive grid/axes, text in ink tokens)
export const INK = "#eef1f6";
export const INK2 = "#a9b1c1";
export const MUTED = "#7a8396";
export const GRID = "#1c2333";
export const AXIS = "#2a3244";

export const axis = (name: string, extra: object = {}) => ({
  name,
  nameLocation: "middle",
  nameGap: 34,
  nameTextStyle: { color: INK2, fontSize: 12, fontFamily: "Geist" },
  axisLine: { lineStyle: { color: AXIS } },
  axisTick: { show: false },
  axisLabel: { color: MUTED, fontFamily: "Geist Mono", fontSize: 12 },
  splitLine: { lineStyle: { color: GRID } },
  ...extra,
});

export const tooltip = {
  backgroundColor: "rgba(11,14,22,0.96)",
  borderColor: "rgba(255,255,255,0.1)",
  borderWidth: 1,
  padding: [10, 12],
  textStyle: { color: INK, fontFamily: "Geist", fontSize: 12 },
  extraCssText: "border-radius:12px;box-shadow:0 20px 40px -12px rgba(0,0,0,.6);backdrop-filter:blur(8px);",
};

export function EChart({ option, height = 420, onClick }: { option: Opt; height?: number | string; onClick?: (p: any) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;

  useEffect(() => {
    const c = echarts.init(el.current!, undefined, { renderer: "canvas" });
    chart.current = c;
    c.on("click", (p) => clickRef.current?.(p));
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(el.current!);
    return () => {
      ro.disconnect();
      c.dispose();
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption({ animationDuration: 700, animationEasing: "cubicOut", textStyle: { fontFamily: "Geist" }, ...option }, { notMerge: true });
  }, [option]);

  return <div ref={el} style={{ height, width: "100%" }} />;
}
