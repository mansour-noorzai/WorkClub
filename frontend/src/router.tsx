import {
  createContext,
  type AnchorHTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface RouterValue {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (options?.replace) window.history.replaceState({}, '', to);
    else window.history.pushState({}, '', to);
    setPath(window.location.pathname);
    window.scrollTo({ top: 0 });
  }, []);
  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  return useRouter().path;
}

export function useNavigate() {
  return useRouter().navigate;
}

export function useParams(): { id?: string } {
  const path = useLocation();
  const match = path.match(/^\/projects\/([^/]+)\/board$/);
  return { id: match?.[1] ? decodeURIComponent(match[1]) : undefined };
}

export function useSearchParams(): [URLSearchParams] {
  useLocation();
  return [new URLSearchParams(window.location.search)];
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => navigate(to, { replace }), [navigate, replace, to]);
  return null;
}

export function Link({
  to,
  children,
  onClick,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </a>
  );
}

function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('RouterProvider is required.');
  return context;
}
