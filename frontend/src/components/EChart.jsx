import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import {
  BarChart, BoxplotChart, HeatmapChart, LineChart, PieChart, ScatterChart, TreemapChart,
} from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

// Підключаємо тільки ті частини ECharts, які реально використовуємо —
// бандл виходить утричі меншим, ніж з import * from "echarts".
echarts.use([
  BarChart, BoxplotChart, HeatmapChart, LineChart, PieChart, ScatterChart, TreemapChart,
  GridComponent, LegendComponent, TooltipComponent, VisualMapComponent,
  LabelLayout, CanvasRenderer,
]);

// Тонка обгортка над ECharts: створює інстанс, оновлює option,
// перемальовує при зміні розміру контейнера і при зміні теми.
export default function EChart({ option, theme }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = echarts.init(ref.current, null, { renderer: "canvas" });
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !option) return;
    chart.setOption(option, { notMerge: true });
  }, [option, theme]);

  return <div ref={ref} style={{ position: "absolute", inset: 0 }} />;
}
