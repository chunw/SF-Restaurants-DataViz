// Settings
const LOW_RISK_COLOR = '#B3CD60';
const MODERATE_RISK_COLOR = '#EE9D56';
const HIGH_RISK_COLOR = '#D9493A';
const NO_DATA_RISK_COLOR = '#61A466';
const DATA_PT_RADIUS = 2;
const RESET_RADIUS = 5;

var mapWidth = 750;
var mapHeight = 750;
var csvData;
var countLowRisk = 0;
var countModerateRisk = 0;
var countHighRisk = 0;
var countNoRiskData = 0;
var selectionFrameId = 1;

// SF map projection
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

// Add SVG map
svg.append('image')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('xlink:href', 'data/sf-map.svg');

// Add callbacks for drawing selection frames and filtering to intersection
// Reference: http://bl.ocks.org/lgersman/5310854
svg.on( 'mousedown', function() {
    // Clear a previous selection frame and add a temporary selection frame
    const mousePos = d3.mouse(this);
    svg.selectAll( "circle.selection" + selectionFrameId ).remove();
    svg.append("circle")
    .attr("class", "selection")
    .attr('cx', mousePos[0])
    .attr('cy', mousePos[1])
    .attr('r', 0);
  })
  .on( "mousemove", function() {
    // Update the temporary selection frame
    const mousePos = d3.mouse(this);
    var s = svg.select("circle.selection");
    if (!s.empty()) {
      const centerPos = [parseInt(s.attr("cx"), 10), parseInt(s.attr("cy"), 10)];
      s.attr('r', distance(mousePos, centerPos));
    }
  })
.on( "mouseup", function() {
  var s = svg.select("circle.selection");
  if (!s.empty()) {
    const centerPos = [parseInt(s.attr("cx"), 10), parseInt(s.attr("cy"), 10)];
    const r = parseInt(s.attr( "r"), 10);
    if (r < RESET_RADIUS){
      // Reset the visualization
      svg.selectAll("circle.Restaurant").style("visibility", "visible");
      svg.selectAll("circle.selection1").remove();
      svg.selectAll("circle.selection2").remove();
    } else {
      // Prepare for filtering
      svg.append("circle")
      .attr("class", "selection" + selectionFrameId)
      .attr('cx', centerPos[0])
      .attr('cy', centerPos[1])
      .attr('r', r)
      .lower();
      filterToIntersection();
      updateFrameId();
    }
    // Clear the temporary selection frame
    s.remove();
  }
});

// Add restaurant points and callbacks for filtering by risk
d3.csv("/data/restaurant_scores.csv").then(function(data) {
  csvData = data;
  svg.selectAll("circle")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", d => {
    return projection([d.business_longitude, d.business_latitude])[0];
  })
  .attr("cy", d => {
    return projection([d.business_longitude, d.business_latitude])[1];
  })
  .attr('r', DATA_PT_RADIUS)
  .attr('pointer-events', 'visible')
  .attr('class', d => {
    return "Restaurant " + (d.risk_category ? d.risk_category : "NO_RISK_DATA");
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

// Helper functions
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

function distance(a, b){
  return Math.sqrt(Math.pow((a[0]-b[0]), 2) + Math.pow((a[1]-b[1]), 2));
}

function filterToIntersection() {
  var A = svg.select("circle.selection1");
  var B = svg.select("circle.selection2");
  if (!A.empty() && !B.empty()) {
    svg.selectAll("circle.Restaurant")
    .style("visibility", function(d) {
      const A_center = [parseInt(A.attr("cx"), 10), parseInt(A.attr("cy"), 10)]
      const A_r = parseInt(A.attr( "r"), 10);
      const B_center = [parseInt(B.attr("cx"), 10), parseInt(B.attr("cy"), 10)]
      const B_r = parseInt(B.attr( "r"), 10);
      const projectedLocation = projection([d.business_longitude, d.business_latitude]);
      if (distance(A_center, projectedLocation) < A_r && distance(B_center, projectedLocation) < B_r) {
        return "visible";
      } else {
        return "hidden";
      }
    });
  }
}

function updateFrameId() {
  selectionFrameId = (selectionFrameId++)%2+1;
}

