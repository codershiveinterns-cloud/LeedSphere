import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Read notification deep-link params from the URL.
 *
 * Backend writes redirectUrls like:
 *   /dashboard/channel/123?message=msg456
 *   /dashboard/channel/123?thread=parent789&message=msg456
 *   /dashboard/projects?project=proj1&task=task2
 *   /dashboard/calendar?event=ev1
 *
 * Pages call this hook to learn the entity id they should highlight on
 * mount. Once consumed, the hook strips the query param so a refresh
 * doesn't re-trigger the highlight (and the URL stays clean).
 *
 * Usage:
 *   const { messageId, threadId } = useNotificationDeepLink(['message', 'thread']);
 *   useEffect(() => { if (messageId) scrollToMessage(messageId); }, [messageId]);
 */
const useNotificationDeepLink = (keys) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [snapshot] = useState(() => {
    const out = {};
    for (const key of keys) {
      const v = searchParams.get(key);
      if (v) out[`${key}Id`] = v;
    }
    return out;
  });

  // Strip the consumed params after first render so the URL stays clean
  // and a re-render doesn't keep firing the highlight effect.
  useEffect(() => {
    if (!Object.keys(snapshot).length) return;
    const next = new URLSearchParams(searchParams);
    let changed = false;
    for (const key of keys) {
      if (next.has(key)) { next.delete(key); changed = true; }
    }
    if (changed) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot consume
  }, []);

  return snapshot;
};

export default useNotificationDeepLink;
