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
  });
  fullData = data;
  updateDashboard(fullData);
});

// Update All Charts
function updateDashboard(data) {
  drawPie("#pieChart", data, (filtered) => {
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

//pie chart//
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

  // Create all slices
  const slices = g.selectAll("path")
    .data(pie(pieData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data[0]))
    .attr("stroke", "#0d1117")
    .attr("stroke-width", "2px")
    .style("cursor", "pointer");

  // On slice click
  slices.on("click", function(event, d) {
    if (onSliceClick) {
      const filtered = fullData.filter(row => row.Origin === d.data[0]);
      onSliceClick(filtered);
    }

    // Highlight clicked slice
    slices.transition().duration(300)
      .attr("opacity", s => (s.data[0] === d.data[0] ? 1 : 0.3))
      .attr("stroke-width", s => (s.data[0] === d.data[0] ? 4 : 2));

    // Show Reset Button
    document.getElementById("resetButton").style.display = "block";
  });

  // Add Labels inside Pie Slices
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

// LINE CHART
function drawLine(selector, data) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();
  const grouped = d3.rollups(data, v => d3.mean(v, d => d.MPG), d => d["Model Year"]).sort((a, b) => a[0] - b[0]);
  const width = 500, height = 400, margin = { top: 30, right: 20, bottom: 50, left: 60 };
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear().domain(d3.extent(grouped, d => d[0])).range([0, width - margin.left - margin.right]);
  const y = d3.scaleLinear().domain([0, d3.max(grouped, d => d[1])]).range([height - margin.top - margin.bottom, 0]);

  g.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x)).selectAll("text").style("fill", "#ccc");
  g.append("g")
    .call(d3.axisLeft(y)).selectAll("text").style("fill", "#ccc");

  g.append("path")
    .datum(grouped)
    .attr("fill", "none")
    .attr("stroke", "#90caf9")
    .attr("stroke-width", 2)
    .attr("d", d3.line().x(d => x(d[0])).y(d => y(d[1])));

  // Add X-axis Label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Model Year");

  // Add Y-axis Label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Average MPG");
}

// SCATTER PLOT
function drawScatter(selector, data) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();
  const width = 500, height = 400, margin = { top: 30, right: 20, bottom: 50, left: 60 };
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.Horsepower)).nice().range([0, width - margin.left - margin.right]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.Weight)).nice().range([height - margin.top - margin.bottom, 0]);
  const color = d3.scaleOrdinal().domain(["American", "European", "Japanese"]).range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

  g.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x)).selectAll("text").style("fill", "#ccc");
  g.append("g")
    .call(d3.axisLeft(y)).selectAll("text").style("fill", "#ccc");

  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.Horsepower))
    .attr("cy", d => y(d.Weight))
    .attr("r", 4)
    .attr("fill", d => color(d.Origin))
    .attr("opacity", 0.7);

  // Add Legend
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

  // Add X-axis Label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Horsepower");

  // Add Y-axis Label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("fill", "#ccc")
    .style("font-size", "14px")
    .text("Weight");
}

// BAR CHART
function drawBarChart(selector, data) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();
  const grouped = d3.rollups(data, v => v.length, d => d.Cylinders).sort((a, b) => a[0] - b[0]);
  const width = 500, height = 400, margin = { top: 40, right: 20, bottom: 50, left: 60 };
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleBand().domain(grouped.map(d => d[0])).range([0, width - margin.left - margin.right]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(grouped, d => d[1])]).nice().range([height - margin.top - margin.bottom, 0]);

  g.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x)).selectAll("text").style("fill", "#ccc");
  g.append("g")
    .call(d3.axisLeft(y)).selectAll("text").style("fill", "#ccc");

  g.selectAll("rect")
    .data(grouped)
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - margin.top - margin.bottom - y(d[1]))
    .attr("fill", "#3b82f6");
}

// HEATMAP
function drawHeatmap(selector, data) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();
  const width = 500, height = 400, margin = { top: 30, right: 20, bottom: 50, left: 60 };
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
  const color = d3.scaleSequential(d3.interpolateBlues).domain([0, d3.max(heatmapData, d => d.mpg)]);

  g.selectAll()
    .data(heatmapData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.origin))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", d => color(d.mpg));

  g.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d => `'${d.toString().slice(-2)}`)).selectAll("text").style("fill", "#ccc").attr("transform", "rotate(45)").style("text-anchor", "start");
  g.append("g")
    .call(d3.axisLeft(y)).selectAll("text").style("fill", "#ccc");
}
// RESET BUTTON FUNCTIONALITY
document.getElementById("resetButton").addEventListener("click", function() {
  selectedRegion = null;
  updateDashboard(fullData); // Redraw full dashboard without any filter

  // Hide reset button again
  document.getElementById("resetButton").style.display = "none";
});
