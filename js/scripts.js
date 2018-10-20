// Settings
const LOW_RISK_COLOR = '#B3CD60';
const MODERATE_RISK_COLOR = '#EE9D56';
const HIGH_RISK_COLOR = '#D9493A';
const NO_DATA_RISK_COLOR = '#61A466';
const DATA_PT_RADIUS = 2;

var mapWidth = 750;
var mapHeight = 750;
var csvData;
var countLowRisk = 0;
var countModerateRisk = 0;
var countHighRisk = 0;
var countNoRiskData = 0;

var projection = d3.geoMercator()
  .center([-122.433701, 37.767683]) // San Francisco, roughly
  .scale(225000)
  .translate([mapWidth / 2, mapHeight / 2]);

var svg = d3.select('#svg').append('svg')
  .attr('width', mapWidth)
  .attr('height', mapHeight);

var tooltip = d3.select("body")
  .append("div")
  .attr('class', 'tooltip');

svg.append('image')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('xlink:href', 'data/sf-map.svg');

d3.csv("/data/restaurant_scores.csv").then(function(data) {
  csvData = data;
  const circles = svg.selectAll("circle")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", d => {
    var projectedLocation = projection([d.business_longitude, d.business_latitude]);
    return projectedLocation[0];
  })
  .attr("cy", d => {
    var projectedLocation = projection([d.business_longitude, d.business_latitude]);
    return projectedLocation[1];
  })
  .attr('r', DATA_PT_RADIUS)
  .attr('class', d => {
    return d.risk_category ? d.risk_category : "NO_RISK_DATA";
  })
  .style('fill', d => {
    switch (d.risk_category) {
      case "Low Risk":
        countLowRisk++;
        return LOW_RISK_COLOR;
      case "Moderate Risk":
        countModerateRisk++;
        return MODERATE_RISK_COLOR;
      case "High Risk":
        countHighRisk++;
        return HIGH_RISK_COLOR;
      default:
        countNoRiskData++;
        return NO_DATA_RISK_COLOR;
    }
  })
  .on('mouseover', function(d) {
    const color = getRiskColor(d);
    return tooltip.style("visibility", "visible").html(
      `<div>
        <div>
          <span style="color: ${color}; font-weight: bold">${d.business_name}</span>
          <span style="color: #D3D3D3"> | </span>
          <span style="color: white;">Inspection Score: ${d.inspection_score}</span>
        </div>
      </div>`
    );
  })
  .on('mousemove', function() {
   return tooltip
     .style("top", (event.pageY - 30) + "px")
     .style("left", event.pageX + "px");
  })
  .on('mouseout', function() {
    return tooltip.style("visibility", "hidden");
  });

  setupLegend();
});

function toggleData(checkbox, category=null) {
  if (category) {
    category += " Risk";
  } else {
    category = "NO_RISK_DATA";
  }
  const selection = document.getElementsByClassName(category);
  if (checkbox.checked) {
    render(selection);
  } else {
    hide(selection);
  }
}

function render(selection) {
  Array.from(selection).forEach(d => {
    d.style.display = "block";
  })
}

function hide(selection) {
  Array.from(selection).forEach(d => {
    d.style.display = "none";
  })
}

function setupLegend() {
  document.getElementById("No_Risk_Data").style.color = NO_DATA_RISK_COLOR;
  document.getElementById("Low_Risk").style.color = LOW_RISK_COLOR;
  document.getElementById("Moderate_Risk").style.color = MODERATE_RISK_COLOR;
  document.getElementById("High_Risk").style.color = HIGH_RISK_COLOR;
  document.getElementById("No_Risk_Data_COUNT").innerHTML = countNoRiskData;
  document.getElementById("Low_Risk_COUNT").innerHTML = countLowRisk;
  document.getElementById("Moderate_Risk_COUNT").innerHTML = countModerateRisk;
  document.getElementById("High_Risk_COUNT").innerHTML = countHighRisk;
}

function getRiskColor(d) {
  switch (d.risk_category) {
    case "Low Risk":
      return LOW_RISK_COLOR;
    case "Moderate Risk":
      return MODERATE_RISK_COLOR;
    case "High Risk":
      return HIGH_RISK_COLOR;
    default:
      return NO_DATA_RISK_COLOR;
  }
}
