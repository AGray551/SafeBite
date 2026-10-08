/**
 * The contract between the UI and the backend.
 *
 * Every screen talks to the backend through this interface, never through
 * fetch() directly. There are two implementations:
 *
 *   - http/httpClient.ts  → the real REST API (VITE_API_BASE_URL)
 *   - mock/mockClient.ts  → in-browser fixtures + localStorage, so the
 *                           frontend runs today without a backend
 *
 * When the backend team adds an endpoint, add the method here first; the
 * TypeScript compiler will then point at both clients that need updating.
 */
import type {
  DietaryProfile,
  DiningHall,
  Favorites,
  MealPeriod,
  Menu,
  MenuItem,
  NewReport,
  Report,
  SafetyAlert,
  Session,
} from './schemas';

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  name: string;
}

export interface MenuQuery {
  /** YYYY-MM-DD */
  date: string;
  mealPeriod: MealPeriod;
}

export interface ItemSearchQuery {
  q: string;
  date: string;
  mealPeriod?: MealPeriod;
  hallId?: string;
}

export interface SafeBiteApi {
  auth: {
    signIn(input: SignInInput): Promise<Session>;
    signUp(input: SignUpInput): Promise<Session>;
    signOut(): Promise<void>;
    /** Returns the stored session, or null when signed out. */
    getSession(): Promise<Session | null>;
  };
  halls: {
    list(): Promise<DiningHall[]>;
    get(hallId: string): Promise<DiningHall>;
  };
  menus: {
    /** One menu per hall for the given date and meal period. */
    list(query: MenuQuery): Promise<Menu[]>;
    get(hallId: string, query: MenuQuery): Promise<Menu>;
  };
  items: {
    get(itemId: string): Promise<MenuItem>;
    getMany(itemIds: string[]): Promise<MenuItem[]>;
    search(query: ItemSearchQuery): Promise<MenuItem[]>;
  };
  profile: {
    get(): Promise<DietaryProfile | null>;
    save(profile: Omit<DietaryProfile, 'updatedAt'>): Promise<DietaryProfile>;
    delete(): Promise<void>;
  };
  favorites: {
    get(): Promise<Favorites>;
    setItem(itemId: string, saved: boolean): Promise<Favorites>;
    setHall(hallId: string, saved: boolean): Promise<Favorites>;
  };
  alerts: {
    list(): Promise<SafetyAlert[]>;
    markRead(alertId: string): Promise<SafetyAlert>;
  };
  reports: {
    submit(report: NewReport): Promise<Report>;
  };
}

/** Error thrown by either client so screens can show a consistent message. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
