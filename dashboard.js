let fullData = [];
let selectedRegion = null;

// Load Data
d3.csv("cars.csv").then(data => {
  data.forEach(d => {
    d.MPG = +d.MPG;
    d.Horsepower = +d.Horsepower;
    d.Weight = +d.Weight;
    d["Model Year"] = +d["Model Year"];
    d.Cylinders = +d.Cylinders;
    d.Origin = d.Origin;
    d.Name = d.Name; 

  });

  fullData = data;
  updateDashboard(fullData);

  // Populate Dropdown
  const years = Array.from(new Set(fullData.map(d => d["Model Year"]))).sort((a, b) => a - b);
  const dropdown = document.getElementById("yearDropdown");
  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    dropdown.appendChild(option);
  });

  // Dropdown Change Handler
  dropdown.addEventListener("change", function () {
    const selectedYear = this.value;
    if (selectedYear === "all") {
      updateDashboard(fullData);
    } else {
      const filtered = fullData.filter(d => d["Model Year"] === +selectedYear);
      updateDashboard(filtered);
      document.getElementById("resetButton").style.display = "block";
    }
  });
});

// Update All Charts
function updateDashboard(data) {
  drawPie("#pieChart", data, filtered => {
    drawLine("#lineChart", filtered);
    drawScatter("#scatterChart", filtered);
    drawBarChart("#barChart", filtered);
    drawHeatmap("#heatmapChart", filtered);
  });

  drawLine("#lineChart", data);
  drawScatter("#scatterChart", data);
  drawBarChart("#barChart", data);
  drawHeatmap("#heatmapChart", data);
}

// Pie Chart
function drawPie(selector, data, onSliceClick = null) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();

  const width = 400, height = 400, radius = Math.min(width, height) / 2;
  const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

  const pieData = d3.rollups(data, v => v.length, d => d.Origin);
  const pie = d3.pie().value(d => d[1]);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);
  const color = d3.scaleOrdinal()
    .domain(["American", "European", "Japanese"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

  const slices = g.selectAll("path")
    .data(pie(pieData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data[0]))
    .attr("stroke", "#0d1117")
    .attr("stroke-width", "2px")
    .style("cursor", "pointer");

  slices.on("click", function (event, d) {
    if (onSliceClick) {
      const filtered = fullData.filter(row => row.Origin === d.data[0]);
      onSliceClick(filtered);
    }

    slices.transition().duration(300)
      .attr("opacity", s => (s.data[0] === d.data[0] ? 1 : 0.3))
      .attr("stroke-width", s => (s.data[0] === d.data[0] ? 4 : 2));

    document.getElementById("resetButton").style.display = "block";
  });

  g.selectAll("text")
    .data(pie(pieData))
    .enter()
    .append("text")
    .text(d => d.data[0])
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .style("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "13px");
}

// Line Chart
function drawLine(selector, data) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();

  const grouped = d3.rollups(data, v => d3.mean(v, d => d.MPG), d => d["Model Year"])
                    .sort((a, b) => a[0] - b[0]);

  const width = 500, height = 400;
  const margin = { top: 30, right: 20, bottom: 50, left: 60 };
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(grouped, d => d[0]))
    .range([0, width - margin.left - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(grouped, d => d[1])])
    .range([height - margin.top - margin.bottom, 0]);

  g.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text")
    .style("fill", "#ccc");

  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "#ccc");

  // Line Path
  g.append("path")
    .datum(grouped)
    .attr("fill", "none")
    .attr("stroke", "#90caf9")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => x(d[0]))
      .y(d => y(d[1]))
    );

  // Tooltip setup
  let tooltip = d3.select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  // Add dots with tooltip
  g.selectAll("circle")
    .data(grouped)
    .enter()
    .append("circle")
    .attr("cx", d => x(d[0]))
    .attr("cy", d => y(d[1]))
    .attr("r", 5)
    .attr("fill", "#facc15")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`Year: ${d[0]}<br>Avg MPG: ${d[1].toFixed(2)}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(300).style("opacity", 0);
    });

  // X and Y labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Model Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Average MPG");
} 
// Scatter Chart
function drawScatter(selector, data) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();

  const width = 500, height = 400;
  const margin = { top: 30, right: 20, bottom: 50, left: 60 };
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Horsepower)).nice()
    .range([0, width - margin.left - margin.right]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Weight)).nice()
    .range([height - margin.top - margin.bottom, 0]);

  const color = d3.scaleOrdinal()
    .domain(["American", "European", "Japanese"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

  g.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x)).selectAll("text").style("fill", "#ccc");

  g.append("g")
    .call(d3.axisLeft(y)).selectAll("text").style("fill", "#ccc");

  // Tooltip setup (global element if not already created)
  let tooltip = d3.select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.Horsepower))
    .attr("cy", d => y(d.Weight))
    .attr("r", 4)
    .attr("fill", d => color(d.Origin))
    .attr("opacity", 0.7)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(
        `<strong>${d.Name}</strong><br>
         Horsepower: ${d.Horsepower}<br>
         MPG: ${d.MPG}<br>
         Weight: ${d.Weight}`
      )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(300).style("opacity", 0);
    });

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 120}, 30)`);

  ["American", "European", "Japanese"].forEach((region, i) => {
    legend.append("circle")
      .attr("cx", 0)
      .attr("cy", i * 20)
      .attr("r", 6)
      .attr("fill", color(region));

    legend.append("text")
      .attr("x", 12)
      .attr("y", i * 20 + 5)
      .text(region)
      .style("fill", "#ccc")
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
  });

  // X and Y labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Horsepower");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Weight");
}

// Bar Chart
function drawBarChart(selector, data) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();

  const grouped = d3.rollups(data, v => v.length, d => d.Cylinders).sort((a, b) => a[0] - b[0]);
  const width = 500, height = 400;
  const margin = { top: 40, right: 20, bottom: 50, left: 60 };
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(grouped.map(d => d[0]))
    .range([0, width - margin.left - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(grouped, d => d[1])])
    .nice()
    .range([height - margin.top - margin.bottom, 0]);

  g.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("fill", "#ccc");

  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "#ccc");

  // Tooltip setup
  let tooltip = d3.select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  g.selectAll("rect")
    .data(grouped)
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - margin.top - margin.bottom - y(d[1]))
    .attr("fill", "#3b82f6")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`Cylinders: ${d[0]}<br>Car Count: ${d[1]}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(300).style("opacity", 0);
    });

  // X and Y Labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Cylinders");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Car Count");
}


// Heatmap
function drawHeatmap(selector, data) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();

  const width = 500, height = 400;
  const margin = { top: 40, right: 20, bottom: 60, left: 80 };
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const modelYears = Array.from(new Set(data.map(d => d["Model Year"]))).sort((a, b) => a - b);
  const origins = ["American", "European", "Japanese"];

  const x = d3.scaleBand().domain(modelYears).range([0, width - margin.left - margin.right]).padding(0.05);
  const y = d3.scaleBand().domain(origins).range([0, height - margin.top - margin.bottom]).padding(0.05);

  const meanData = d3.rollup(data, v => d3.mean(v, d => d.MPG), d => d["Model Year"], d => d.Origin);

  const heatmapData = [];
  modelYears.forEach(year => {
    origins.forEach(origin => {
      const mpg = meanData.get(year)?.get(origin) || 0;
      heatmapData.push({ year, origin, mpg });
    });
  });

  const color = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, d3.max(heatmapData, d => d.mpg)]);

  // Tooltip
  let tooltip = d3.select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  g.selectAll("rect")
    .data(heatmapData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.origin))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", d => color(d.mpg))
    .style("stroke", "#222")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`Region: ${d.origin}<br>Year: ${d.year}<br>Avg MPG: ${d.mpg.toFixed(2)}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(300).style("opacity", 0);
    });

  // X Axis
  g.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d => `'${d.toString().slice(-2)}`))
    .selectAll("text")
    .style("fill", "#ccc")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");

  // Y Axis
  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "#ccc");

  // Axis Labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Model Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Region");

  // Color Legend
  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legendGradient");

  linearGradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.1))
    .enter()
    .append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => color(d * d3.max(heatmapData, d => d.mpg)));

  const legendWidth = 150, legendHeight = 10;
  svg.append("rect")
    .attr("x", width - legendWidth - 30)
    .attr("y", 10)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legendGradient)");

  const legendScale = d3.scaleLinear()
    .domain(color.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".1f"));

  svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 30}, 20)`)
    .call(legendAxis)
    .selectAll("text")
    .style("fill", "#ccc")
    .style("font-size", "10px");
}

// Reset Button Functionality
document.getElementById("resetButton").addEventListener("click", function () {
  selectedRegion = null;
  document.getElementById("yearDropdown").value = "all"; // Reset the dropdown selection
  updateDashboard(fullData); // Redraw all charts with full data
  document.getElementById("resetButton").style.display = "none"; // Hide the button again
});
