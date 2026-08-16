import { getActionsByIncidentId } from "./actions";
import { getIncidentsByServiceId } from "./incidents";
import { getMemoryByIncidentId } from "./memories";
import { getServiceById, getServiceByName } from "./services";
import type { ServiceHistory } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Retrieve full incident history for a service (incidents + actions + memory).
 */
export async function getServiceHistory(
  serviceIdOrName: string,
): Promise<ServiceHistory | null> {
  const service = UUID_RE.test(serviceIdOrName)
    ? await getServiceById(serviceIdOrName)
    : await getServiceByName(serviceIdOrName);
  if (!service) return null;

  const incidents = await getIncidentsByServiceId(service.id);
  const detailed = await Promise.all(
    incidents.map(async (incident) => {
      const [actions, memory] = await Promise.all([
        getActionsByIncidentId(incident.id),
        getMemoryByIncidentId(incident.id),
      ]);
      return { ...incident, actions, memory };
    }),
  );

  return { service, incidents: detailed };
}
