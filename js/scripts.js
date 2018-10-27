// Settings
const GRAY = '#DDDDDD';
const LOW_RISK_COLOR = '#B3CD60';
const MODERATE_RISK_COLOR = '#EE9D56';
const HIGH_RISK_COLOR = '#D9493A';
const NO_DATA_RISK_COLOR = '#61A466';
const DATA_PT_RADIUS = 2;
const LOCATION_TEXT_OFFSET = 4;
const mapWidth = 750;
const mapHeight = 750;

var csvData;
var filteredData = [];
var countLowRisk = 0;
var countModerateRisk = 0;
var countHighRisk = 0;
var countNoRiskData = 0;
var selection = 'A';

// Init Materialize components
M.AutoInit();

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
  if (selection === null) return;

  const mousePos = d3.mouse(this);
  svg.append("circle")
  .attr('id', 'circle' + selection)
  .attr('cx', mousePos[0])
  .attr('cy', mousePos[1])
  .attr('r', 10);
  svg.append("text")
  .attr('id', 'location' + selection)
  .attr('class', "location-text")
  .attr('x', mousePos[0] - LOCATION_TEXT_OFFSET)
  .attr('y', mousePos[1] + LOCATION_TEXT_OFFSET)
  .text(selection)
  .call(d3.drag().on("start", dragLocationText));
})
.on( "mousemove", function() {
  const mousePos = d3.mouse(this);
  var s = svg.select("#circle" + selection);
  if (!s.empty()) {
    const centerPos = [parseInt(s.attr("cx"), 10), parseInt(s.attr("cy"), 10)];
    const radius = distance(mousePos, centerPos);
    s.attr('r', radius);

    // Show filter range on right-side panel
    const r_in_miles = computeDistanceInMiles(centerPos, radius);
    let filterElement = null;
    if (selection == "A") {
      filterElement = $("#filter-range-a");
    } else if (selection == "B") {
      filterElement = $("#filter-range-b");
    } else {
      console.log("Error getting filterElement");
    }
    filterElement.text(`${r_in_miles.toFixed(2)} miles`);
  }
  updateFilteredListOnMap(selection);
})
.on( "mouseup", function() {
  if (selection==='A' || selection==='B'){
    svg.select("#circle" + selection).lower();
    nextSelection();
  } else {
    resetFilter();
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
        <span style="color: ${color}; font-weight: bold">${d.business_name}</span>
        <span style="color: #D3D3D3"> | </span>
        <span style="color: white;">Inspection Score: ${d.inspection_score}</span>
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

function updateFilteredListInView(data) {
  // sort data by score
  data = data.sort(function(a, b){return b.inspection_score - a.inspection_score});

  const container = $("#result-list");
  template = ``;
  $("#filter-count").text(data.length);
  data.forEach(d => {
    template +=
    `<li class="collection-item avatar">
        <span class="title">${d.business_name}</span>
        <p>
          <span class="content address">${d.business_address} </span><br>
          <span class="content violation"><span class="title">Inspection Score:</span> ${d.inspection_score} (inspected on: ${d.inspection_date || "N/A"})</span><br>
          <span class="content violation"><span class="title">Violation:</span> ${d.violation_description || "No violation found"}</span>
        </p>
        <span class="secondary-content" style="color:${getRiskColor(d)}"><i class="material-icons">${d.risk_category || "No risk"}</i></span>
      </li>
    `
  });
  container.html(template);
}

function clearResultList() {
  $("#filter-count").text(0);
  const container = $("#result-list");
  container.html(``);
}

function dedupRestaurants(restaurants) {
  return Array.from(restaurants.reduce((m, t) => m.set(t.business_id, t), new Map()).values());
}

function formatPhoneNum(phone) {
    phone = phone.replace(/[^\d]/g, "");
    //check if number length equals to 10
    if (phone.length == 11) {
        //reformat and return phone number in format (234) 567-8900
        return phone.substr(1).replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    }
    return null;
}

function distance(a, b){
  return Math.sqrt(Math.pow((a[0]-b[0]), 2) + Math.pow((a[1]-b[1]), 2));
}

function updateFilteredListOnMap(location) {
  filteredData = [];
  var A = svg.select("#circleA");
  var B = svg.select("#circleB");
  if (!A.empty() && !B.empty()) {
    svg.selectAll("circle.Restaurant")
    .style("fill", function(d) {
      const A_center = [parseInt(A.attr("cx"), 10), parseInt(A.attr("cy"), 10)]
      const A_r = parseInt(A.attr( "r"), 10);
      const B_center = [parseInt(B.attr("cx"), 10), parseInt(B.attr("cy"), 10)]
      const B_r = parseInt(B.attr( "r"), 10);
      const projectedLocation = projection([d.business_longitude, d.business_latitude]);
      if (distance(A_center, projectedLocation) < A_r && distance(B_center, projectedLocation) < B_r) {
        filteredData.push(d);
        return getRiskColor(d);
      } else {
        return GRAY;
      }
    });
    updateFilteredListInView(dedupRestaurants(filteredData));
  } else {
    var s = svg.select("#circle" + location);
    if (!s.empty()) {
      svg.selectAll("circle.Restaurant")
      .style("fill", function(d) {
        const center = [parseInt(s.attr("cx"), 10), parseInt(s.attr("cy"), 10)]
        const r = parseInt(s.attr( "r"), 10);
        const projectedLocation = projection([d.business_longitude, d.business_latitude]);
        if (distance(center, projectedLocation) < r) {
          filteredData.push(d);
          return getRiskColor(d);
        } else {
          return GRAY;
        }
      });
      updateFilteredListInView(dedupRestaurants(filteredData));
    }
  }
}

function nextSelection() {
  if (selection === 'A'){
    selection = 'B'
  } else {
    selection = null;
  }
}

// Reference: https://github.com/d3/d3-drag
function dragLocationText() {
  var element = d3.select(this).classed("dragging", true);

  d3.event.on("drag", dragged).on("end", ended);

  function dragged(d) {
    const location = d3.select(this).text();
    updateFilteredListOnMap(location);
    element.raise().attr("x", d3.event.x - LOCATION_TEXT_OFFSET).attr("y", d3.event.y + LOCATION_TEXT_OFFSET);
    d3.select('#circle' + location).attr("cx", d3.event.x).attr("cy", d3.event.y);
  }

  function ended() {
    element.classed("dragging", false);
  }
}

function resetFilter() {
  svg.select("#circleA").remove();
  svg.select("#locationA").remove();
  svg.select("#circleB").remove();
  svg.select("#locationB").remove();
  svg.selectAll("circle.Restaurant").style("fill", d => getRiskColor(d));
  selection = 'A';
  filteredData = [];
  $("#filter-range-a").text("");
  $("#filter-range-b").text("");
  updateFilteredListInView(dedupRestaurants(filteredData));
}

//This function takes in latitude and longitude of two location
// and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2)
{
  var R = 6371; // km
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
  return Value * Math.PI / 180;
}

function convertKmToMiles(km) {
  return km * 0.621371;
}

function computeDistanceInMiles(center, radius) {
  //projection.invert([x, y]) returns [lon, lat]
  const loc1 = projection.invert(center);
  const loc2_x = center[0] + radius;
  const loc2_y = center[1];
  const loc2 = projection.invert([loc2_x, loc2_y]);
  const distanceInKm = calcCrow(loc1[0], loc1[1], loc2[0], loc2[1]);
  return convertKmToMiles(distanceInKm);
}
