import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll-to-top on route change.
 *
 * React Router doesn't reset scroll position when you navigate. On a long
 * page (like the landing footer), clicking a footer link mounts the new
 * page but leaves you scrolled to the bottom — making the new page look
 * blank because you're staring at *its* footer.
 *
 * Mount once near the top of the tree, inside <BrowserRouter>. No props.
 *
 * Hash links (`/#features`) are exempt — those are intentional anchors
 * inside the same page, and forcing them to top would defeat the point.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return; // let the browser handle the anchor jump
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
