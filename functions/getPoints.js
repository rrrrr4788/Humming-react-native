//adopted from https://stackoverflow.com/questions/13491676/get-all-pixel-coordinates-between-2-points

function slope(a, b) {
  if (a[0] == b[0]) {
    return null;
  }

  return (b[1] - a[1]) / (b[0] - a[0]);
}

function intercept(point, slope) {
  if (slope === null) {
    // vertical line
    return point[0];
  }

  return point[1] - slope * point[0];
}

export async function getPoints(A, B) {
  var m = slope(A, B);
  var b = intercept(A, m);
  var coordinates = [];
  for (var x = A[0]; x <= B[0]; x += (B[0] - A[0]) / 50) {
    var y = m * x + b;
    coordinates.push({
      latitude: parseFloat(x.toPrecision(15)),
      longitude: parseFloat(y.toPrecision(15)),
    });
  }
  if (coordinates.length == 0) {
    for (var x = A[0]; x >= B[0]; x -= (A[0] - B[0]) / 50) {
      var y = m * x + b;
      coordinates.push({
        latitude: parseFloat(x.toPrecision(15)),
        longitude: parseFloat(y.toPrecision(15)),
      });
    }
  }

  coordinates.push({
    latitude: parseFloat(B[0].toPrecision(15)),
    longitude: parseFloat(B[1].toPrecision(15)),
  });
  return coordinates;
}
