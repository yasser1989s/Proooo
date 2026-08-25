import { Parcel, SmartTourStats, DayTourSummary, DriverState } from '../types';

/**
 * Calculates Haversine distance in Kilometers between two GPS coordinates,
 * factoring in typical urban road winding (x1.28).
 */
export function calculateDrivingDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;

  // Urban factor (roads aren't straight lines)
  return Math.round(directDistance * 1.28 * 10) / 10;
}

/**
 * Estimates driving time in minutes assuming average city speed ~25 km/h + 1 min traffic cushion
 */
export function estimateDrivingMinutes(distanceKm: number): number {
  if (distanceKm <= 0.1) return 1;
  const avgSpeedKmh = 24;
  const minutes = (distanceKm / avgSpeedKmh) * 60 + 1;
  return Math.max(1, Math.round(minutes));
}

/**
 * Updates step-by-step route distances and orders for the parcel list
 */
export function updateRouteMetrics(
  parcels: Parcel[],
  driverGps: { lat: number; lng: number } | null
): Parcel[] {
  const activeParcels = parcels.filter(
    (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
  );
  const completedParcels = parcels.filter(
    (p) => p.status === 'delivered' || p.status === 'absent' || p.status === 'failed'
  );

  let currentLat = driverGps?.lat ?? 52.52;
  let currentLng = driverGps?.lng ?? 13.405;

  const updatedActive = activeParcels.map((parcel, index) => {
    let distanceKm = 0;
    let fromPrevKm = 0;

    if (parcel.lat && parcel.lng) {
      // Distance from driver
      distanceKm = calculateDrivingDistanceKm(
        driverGps ? driverGps.lat : currentLat,
        driverGps ? driverGps.lng : currentLng,
        parcel.lat,
        parcel.lng
      );

      // Distance from previous stop
      if (index === 0) {
        fromPrevKm = distanceKm;
      } else {
        const prev = activeParcels[index - 1];
        if (prev.lat && prev.lng) {
          fromPrevKm = calculateDrivingDistanceKm(
            prev.lat,
            prev.lng,
            parcel.lat,
            parcel.lng
          );
        } else {
          fromPrevKm = distanceKm;
        }
      }
    }

    return {
      ...parcel,
      routeOrder: index + 1,
      distanceFromDriverKm: distanceKm,
      distanceFromPrevKm: fromPrevKm,
      estimatedDrivingMinutes: estimateDrivingMinutes(fromPrevKm),
    };
  });

  return [...completedParcels, ...updatedActive];
}

/**
 * 2-Opt TSP Route Optimizer for remaining parcels from current driver GPS
 */
export function optimizeRemainingRoute(
  parcels: Parcel[],
  driverGps: { lat: number; lng: number } | null
): Parcel[] {
  const activeParcels = parcels.filter(
    (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
  );
  const inactiveParcels = parcels.filter(
    (p) => p.status === 'delivered' || p.status === 'absent' || p.status === 'failed'
  );

  if (activeParcels.length <= 1) {
    return parcels;
  }

  const startLat = driverGps?.lat ?? 52.52;
  const startLng = driverGps?.lng ?? 13.405;

  // Step 1: Nearest Neighbor construction
  const unvisited = [...activeParcels];
  const ordered: Parcel[] = [];

  let curLat = startLat;
  let curLng = startLng;

  // Give delayed parcels a 35% distance discount in TSP priority calculation
  while (unvisited.length > 0) {
    let bestIdx = 0;
    let minScore = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const p = unvisited[i];
      if (p.lat && p.lng) {
        let dist = calculateDrivingDistanceKm(curLat, curLng, p.lat, p.lng);
        if (p.isDelayed) {
          dist *= 0.65; // Priority discount
        }
        if (dist < minScore) {
          minScore = dist;
          bestIdx = i;
        }
      }
    }

    const nextParcel = unvisited.splice(bestIdx, 1)[0];
    ordered.push(nextParcel);
    if (nextParcel.lat && nextParcel.lng) {
      curLat = nextParcel.lat;
      curLng = nextParcel.lng;
    }
  }

  // Step 2: 2-Opt local refinement
  let improved = true;
  let iterations = 0;
  const maxIterations = 20;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < ordered.length - 1; i++) {
      for (let k = i + 1; k < ordered.length; k++) {
        const prevLat = i === 0 ? startLat : ordered[i - 1].lat || startLat;
        const prevLng = i === 0 ? startLng : ordered[i - 1].lng || startLng;

        const pA = ordered[i];
        const pB = ordered[k];
        const pBNext = k + 1 < ordered.length ? ordered[k + 1] : null;

        if (!pA.lat || !pA.lng || !pB.lat || !pB.lng) continue;

        const currentDist =
          calculateDrivingDistanceKm(prevLat, prevLng, pA.lat, pA.lng) +
          (pBNext && pBNext.lat && pBNext.lng
            ? calculateDrivingDistanceKm(pB.lat, pB.lng, pBNext.lat, pBNext.lng)
            : 0);

        const newDist =
          calculateDrivingDistanceKm(prevLat, prevLng, pB.lat, pB.lng) +
          (pBNext && pBNext.lat && pBNext.lng
            ? calculateDrivingDistanceKm(pA.lat, pA.lng, pBNext.lat, pBNext.lng)
            : 0);

        if (newDist < currentDist - 0.05) {
          // Reverse segment from i to k
          const sub = ordered.slice(i, k + 1).reverse();
          ordered.splice(i, k - i + 1, ...sub);
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  // Assign route orders
  const updatedActive = ordered.map((p, idx) => ({
    ...p,
    routeOrder: idx + 1,
  }));

  const merged = [...inactiveParcels, ...updatedActive];
  return updateRouteMetrics(merged, driverGps);
}

/**
 * Determines the Next Best Parcel dynamically
 */
export function determineNextBestParcel(
  parcels: Parcel[],
  driverGps: { lat: number; lng: number } | null
): Parcel | null {
  const activeParcels = parcels.filter(
    (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
  );

  if (activeParcels.length === 0) return null;

  // 1. If there is a delayed parcel, prioritize it
  const delayed = activeParcels.find((p) => p.isDelayed);
  if (delayed) return delayed;

  // 2. Return the lowest route order parcel (already calculated by optimizer)
  const sorted = [...activeParcels].sort((a, b) => a.routeOrder - b.routeOrder);
  return sorted[0] || null;
}

/**
 * Calculates full smart tour statistics & learned finishing time
 */
export function calculateSmartTourStats(
  parcels: Parcel[],
  driverGps: { lat: number; lng: number } | null,
  driverState?: Partial<DriverState>
): SmartTourStats {
  const totalParcels = parcels.length;
  const deliveredList = parcels.filter((p) => p.status === 'delivered');
  const deliveredCount = deliveredList.length;
  const absentFailed = parcels.filter(
    (p) => p.status === 'absent' || p.status === 'failed'
  ).length;

  const remainingList = parcels.filter(
    (p) => p.status === 'pending' || p.status === 'in_transit' || p.status === 'reattempt'
  );
  const remainingCount = remainingList.length;

  // Calculate remaining driving distance
  let totalRemainingDist = 0;
  let lastLat = driverGps?.lat ?? 52.52;
  let lastLng = driverGps?.lng ?? 13.405;

  const sortedRemaining = [...remainingList].sort(
    (a, b) => a.routeOrder - b.routeOrder
  );

  for (const p of sortedRemaining) {
    if (p.lat && p.lng) {
      totalRemainingDist += calculateDrivingDistanceKm(lastLat, lastLng, p.lat, p.lng);
      lastLat = p.lat;
      lastLng = p.lng;
    }
  }

  // Calculate total route distance for the whole day
  let totalDayDist = 0;
  const allOrdered = [...parcels].sort((a, b) => a.routeOrder - b.routeOrder);
  let pLat = driverGps?.lat ?? 52.52;
  let pLng = driverGps?.lng ?? 13.405;
  for (const p of allOrdered) {
    if (p.lat && p.lng) {
      totalDayDist += calculateDrivingDistanceKm(pLat, pLng, p.lat, p.lng);
      pLat = p.lat;
      pLng = p.lng;
    }
  }

  // Learn actual average delivery time from completed deliveries today
  let learnedAvgSeconds = driverState?.avgDeliverySeconds || 240; // Default 4 mins

  if (deliveredList.length >= 2) {
    const times = deliveredList
      .filter((p) => p.deliveryTime)
      .map((p) => new Date(p.deliveryTime!).getTime())
      .sort((a, b) => a - b);

    if (times.length >= 2) {
      let totalGaps = 0;
      for (let i = 1; i < times.length; i++) {
        const diffSeconds = (times[i] - times[i - 1]) / 1000;
        // Cap outliers between 1 min (60s) and 20 mins (1200s)
        if (diffSeconds >= 60 && diffSeconds <= 1200) {
          totalGaps += diffSeconds;
        } else {
          totalGaps += 240;
        }
      }
      learnedAvgSeconds = Math.round(totalGaps / (times.length - 1));
    }
  }

  const avgMinutes = Math.round((learnedAvgSeconds / 60) * 10) / 10;

  // Calculate ETA finishing time
  let estimatedFinishTime: string | null = null;
  if (remainingCount > 0) {
    const remainingDrivingMinutes = estimateDrivingMinutes(totalRemainingDist);
    const remainingDeliveryServiceMinutes = (remainingCount * learnedAvgSeconds) / 60;
    const totalRemainingMinutes = Math.round(
      remainingDrivingMinutes + remainingDeliveryServiceMinutes
    );

    const now = new Date();
    const finishDate = new Date(now.getTime() + totalRemainingMinutes * 60000);
    estimatedFinishTime = finishDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const progress =
    totalParcels > 0 ? Math.round(((deliveredCount + absentFailed) / totalParcels) * 100) : 0;

  const nextBest = determineNextBestParcel(parcels, driverGps);

  return {
    totalParcels,
    deliveredParcels: deliveredCount,
    remainingParcels: remainingCount,
    absentFailedParcels: absentFailed,
    totalRemainingDistanceKm: Math.round(totalRemainingDist * 10) / 10,
    totalRouteDistanceKm: Math.max(
      Math.round(totalDayDist * 10) / 10,
      Math.round(totalRemainingDist * 10) / 10
    ),
    avgDeliveryMinutes: avgMinutes,
    estimatedFinishTime,
    progressPercentage: progress,
    nextBestParcel: nextBest,
  };
}

/**
 * Generates an end-of-tour summary
 */
export function generateDayTourSummary(
  parcels: Parcel[],
  stats: SmartTourStats,
  startTime: string | null
): DayTourSummary {
  const delivered = parcels.filter((p) => p.status === 'delivered');
  const absent = parcels.filter((p) => p.status === 'absent').length;
  const failed = parcels.filter((p) => p.status === 'failed').length;

  let fastestMinutes = 1.5;
  let slowestMinutes = 6.8;

  if (delivered.length >= 2) {
    const times = delivered
      .filter((p) => p.deliveryTime)
      .map((p) => new Date(p.deliveryTime!).getTime())
      .sort((a, b) => a - b);

    const gaps: number[] = [];
    for (let i = 1; i < times.length; i++) {
      const diff = (times[i] - times[i - 1]) / 60000;
      if (diff > 0.5 && diff < 30) gaps.push(diff);
    }
    if (gaps.length > 0) {
      fastestMinutes = Math.round(Math.min(...gaps) * 10) / 10;
      slowestMinutes = Math.round(Math.max(...gaps) * 10) / 10;
    }
  }

  const startFormatted = startTime
    ? new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '08:00';
  const finishFormatted = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    date: new Date().toISOString().split('T')[0],
    totalParcels: parcels.length,
    delivered: delivered.length,
    absent,
    failed,
    totalDistanceKm: stats.totalRouteDistanceKm,
    avgDeliveryMinutes: stats.avgDeliveryMinutes,
    fastestDeliveryMinutes: fastestMinutes,
    slowestDeliveryMinutes: slowestMinutes,
    startTime: startFormatted,
    finishTime: finishFormatted,
  };
}

export const optimizeRouteWith2Opt = (
  parcels: Parcel[],
  driverGps: { lat: number; lng: number } | null
) => optimizeRemainingRoute(parcels, driverGps);

export function sortParcelsByProximity(
  parcels: Parcel[],
  driverGps: { lat: number; lng: number } | null
): Parcel[] {
  const startLat = driverGps?.lat ?? 52.52;
  const startLng = driverGps?.lng ?? 13.405;
  const sorted = [...parcels].sort((a, b) => {
    const distA =
      a.lat && a.lng ? calculateDrivingDistanceKm(startLat, startLng, a.lat, a.lng) : 999;
    const distB =
      b.lat && b.lng ? calculateDrivingDistanceKm(startLat, startLng, b.lat, b.lng) : 999;
    return distA - distB;
  });
  return updateRouteMetrics(
    sorted.map((p, idx) => ({ ...p, routeOrder: idx + 1 })),
    driverGps
  );
}

export function prioritizeDelayedParcel(
  parcels: Parcel[],
  delayedId: string,
  driverGps: { lat: number; lng: number } | null
): Parcel[] {
  const target = parcels.find((p) => p.id === delayedId);
  if (!target) return parcels;
  const others = parcels.filter((p) => p.id !== delayedId);
  const prioritized = [target, ...others];
  return updateRouteMetrics(
    prioritized.map((p, idx) => ({ ...p, routeOrder: idx + 1 })),
    driverGps
  );
}
