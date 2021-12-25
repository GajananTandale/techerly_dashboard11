import React, { useEffect, useRef } from "react";
import * as venn from "@upsetjs/venn.js";
import * as d3 from "d3";

export function VennDiagram({ sets = [] }) {
  const chartRef = useRef();

  const chart = venn.VennDiagram();

  // chart.distinct(true);
  chart.useViewBox();

  useEffect(() => {
    const div = d3.select(chartRef.current);

    div.datum(sets).call(chart);

    const tooltip = d3.select("body").append("div").attr("class", "venn-tooltip").style("display", "none");

    div.selectAll("g.venn-area").each(function (datum) {
      const selection = d3.select(this);

      const pathSelect = selection.select("path");

      pathSelect.style("fill", datum.color).style("fill-opacity", 0.75);
      pathSelect
        .on("mouseover", function (_, d) {
          d3.select(this).style("fill-opacity", 1);
        })
        .on("mouseout", function (_, d) {
          d3.select(this).style("fill-opacity", 0.75);
        });

      const textSelect = selection.select("text");

      textSelect.style("fill", "#000").style("font-size", "2rem");
      textSelect.text(data => (data.size > 0 ? data.size : ""));
      textSelect
        .on("mouseover", function (_, d) {
          d3.select(this).style("font-size", "2.5rem");
        })
        .on("mouseout", function (_, d) {
          d3.select(this).style("font-size", "2rem");
        });
    });

    div
      .selectAll("g")
      .on("mouseover", function (_, d) {
        venn.sortAreas(div, d);

        tooltip.transition().duration(400).style("opacity", 1).style("display", "inline");
        tooltip.text(`${Array.from(d.sets).join(", ")} - ${d.size} students`);
      })
      .on("mousemove", function (event) {
        tooltip.style("left", event.pageX + "px").style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(0).style("opacity", 0);
      });
  }, []);

  return <div className="venn-container" ref={chartRef}></div>;
}
