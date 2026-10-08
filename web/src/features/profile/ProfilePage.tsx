import {
  Bell,
  Clock,
  Contrast,
  Heart,
  Info,
  LogIn,
  LogOut,
  Mail,
  Pencil,
  ShieldAlert,
  Trash2,
  Type,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDeleteProfile, useProfile } from '@/api/queries';
import type { DietaryProfile, Severity } from '@/api/schemas';
import { Page } from '@/components/layout/Page';
import { Button, ButtonLink } from '@/components/ui/Button';
import { DietaryBadge } from '@/components/ui/DietaryBadge';
import { LoadingState } from '@/components/ui/QueryState';
import { Switch } from '@/components/ui/Switch';
import { useAuth } from '@/features/auth/authContext';
import { AllergenChip } from '@/features/safety/AllergenChip';
import { usePreferences, type Preferences } from '@/features/settings/preferencesContext';
import { formatUpdatedAt } from '@/lib/time';

export function ProfilePage() {
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/welcome', { replace: true });
  };

  const initials = user?.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 pt-6 pb-5 md:px-6">
          <div
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand font-heading text-xl font-extrabold text-white"
          >
            {initials ?? '?'}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl">{user?.name ?? 'Guest'}</h1>
            <p className="m-0 truncate text-sm text-ink-3">
              {user?.email ?? 'Your profile is saved on this device only'}
            </p>
          </div>
        </div>
      </div>

      <Page>
        <DietaryProfileSection />

        <SettingsSection title="Account">
          {user ? (
            <>
              <InfoRow icon={Mail} label="University email" value={user.email} />
              <ActionRow icon={LogOut} label="Sign out" onClick={handleSignOut} />
            </>
          ) : (
            <div className="flex flex-col gap-3 p-4">
              <p className="m-0 text-sm text-ink-2">
                {isGuest
                  ? 'Create an account to keep your dietary profile and favorites across devices.'
                  : 'Sign in to sync your profile.'}
              </p>
              <ButtonLink to="/sign-in" size="md">
                <LogIn aria-hidden size={18} />
                Sign in or create account
              </ButtonLink>
            </div>
          )}
        </SettingsSection>

        <NotificationSettings />
        <AccessibilitySettings />
        <PrivacySection />

        <SettingsSection title="About SafeBite">
          <InfoRow icon={Info} label="Version" value={__APP_VERSION__} />
          <details className="group border-t border-line px-4 py-1">
            <summary className="flex min-h-12 items-center gap-3 font-bold">
              <ShieldAlert aria-hidden size={20} className="text-ink-3" />
              Allergen safety disclaimer
            </summary>
            <p className="mt-0 mb-3 text-sm text-ink-2">
              SafeBite shows the ingredient and allergen information published by UC Dining.
              Recipes, substitutions and shared equipment can change, and cross-contact may occur.
              SafeBite is not a substitute for talking to dining staff. If you have a severe
              allergy, always confirm before eating.
            </p>
          </details>
        </SettingsSection>
      </Page>
    </>
  );
}

// ---------------------------------------------------------------------------
// Dietary profile summary
// ---------------------------------------------------------------------------

const SEVERITY_GROUPS: {
  severity: Severity;
  title: string;
  tag: string;
  tone: 'avoid' | 'caution' | 'neutral';
}[] = [
  { severity: 'allergy', title: 'Allergies', tag: 'MUST AVOID', tone: 'avoid' },
  { severity: 'intolerance', title: 'Intolerances', tag: 'LIMIT', tone: 'caution' },
  { severity: 'preference', title: 'Avoid when possible', tag: 'FILTER ONLY', tone: 'neutral' },
];

function DietaryProfileSection() {
  const { data: profile, isLoading } = useProfile();

  return (
    <section
      aria-labelledby="dietary-heading"
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
    >
      <div className="flex items-center justify-between">
        <h2 id="dietary-heading" className="text-lg">
          Dietary profile
        </h2>
        {profile && (
          <Link
            to="/onboarding/allergies?from=profile"
            className="flex min-h-11 items-center gap-1.5 px-2 font-bold"
          >
            <Pencil aria-hidden size={16} />
            Edit
          </Link>
        )}
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && !profile && (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-ink-2">
            You haven't set up a dietary profile yet, so menu items aren't checked for you.
          </p>
          <ButtonLink to="/onboarding/allergies?from=profile" size="md">
            Set up dietary profile
          </ButtonLink>
        </div>
      )}
      {profile && <ProfileSummary profile={profile} />}
    </section>
  );
}

function ProfileSummary({ profile }: { profile: DietaryProfile }) {
  return (
    <>
      {SEVERITY_GROUPS.map(({ severity, title, tag, tone }) => {
        const allergens = profile.avoid.filter((a) => a.severity === severity);
        if (allergens.length === 0) return null;
        return (
          <div key={severity} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              {title}
              <span className="text-xs font-extrabold tracking-[0.06em] text-ink-3">{tag}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergens.map((a) => (
                <AllergenChip key={a.allergen} allergen={a.allergen} tone={tone} />
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex flex-col gap-2">
        <div className="text-sm font-bold">Dietary preferences</div>
        {profile.preferences.length || profile.otherPreference ? (
          <div className="flex flex-wrap gap-2">
            {profile.preferences.map((tag) => (
              <DietaryBadge key={tag} tag={tag} />
            ))}
            {profile.otherPreference && (
              <span className="text-sm text-ink-2">{profile.otherPreference}</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-ink-3">None set</span>
        )}
      </div>

      <p className="m-0 flex items-center gap-1.5 text-caption text-ink-3">
        <Clock aria-hidden size={14} />
        Last updated {formatUpdatedAt(profile.updatedAt)}
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function NotificationSettings() {
  return (
    <SettingsSection title="Notifications">
      <PreferenceRow
        icon={Heart}
        label="Favorite meal available"
        setting="notifyFavoriteAvailable"
      />
      <PreferenceRow
        icon={Bell}
        label="Other menu changes to saved foods"
        hint="Safety alerts are always on"
        setting="notifyMenuChanges"
      />
    </SettingsSection>
  );
}

function AccessibilitySettings() {
  return (
    <SettingsSection title="Accessibility">
      <PreferenceRow icon={Type} label="Larger text" setting="largeText" />
      <PreferenceRow
        icon={Waves}
        label="Reduced motion"
        hint="Also follows your device setting"
        setting="reducedMotion"
      />
      <PreferenceRow icon={Contrast} label="High contrast" setting="highContrast" />
    </SettingsSection>
  );
}

function PrivacySection() {
  const { data: profile } = useProfile();
  const deleteProfile = useDeleteProfile();
  const [confirming, setConfirming] = useState(false);

  return (
    <SettingsSection title="Privacy">
      {!confirming ? (
        <ActionRow
          icon={Trash2}
          label="Delete dietary profile"
          hint="Removes your allergies and preferences"
          destructive
          disabled={!profile}
          onClick={() => setConfirming(true)}
        />
      ) : (
        <div role="alert" className="flex flex-col gap-3 p-4">
          <p className="m-0 font-bold">Delete your dietary profile?</p>
          <p className="m-0 text-sm text-ink-2">
            Menu items will no longer be checked against your allergies. This can't be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              disabled={deleteProfile.isPending}
              onClick={() =>
                deleteProfile.mutate(undefined, { onSuccess: () => setConfirming(false) })
              }
            >
              <Trash2 aria-hidden size={18} />
              Delete
            </Button>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Row building blocks
// ---------------------------------------------------------------------------

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-bold tracking-wide text-ink-3 uppercase">{title}</h2>
      <div className="overflow-hidden rounded-card border border-line bg-surface [&>*+*]:border-t [&>*+*]:border-line">
        {children}
      </div>
    </section>
  );
}

function RowLabel({ icon: Icon, label, hint }: { icon: LucideIcon; label: string; hint?: string }) {
  return (
    <>
      <Icon aria-hidden size={20} className="shrink-0 text-ink-3" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-bold">{label}</span>
        {hint && <span className="text-caption text-ink-3">{hint}</span>}
      </span>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
      <RowLabel icon={icon} label={label} />
      <span className="truncate text-sm text-ink-2">{value}</span>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  hint,
  onClick,
  destructive,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-muted disabled:opacity-50 ${destructive ? 'text-avoid' : ''}`}
    >
      <RowLabel icon={icon} label={label} hint={hint} />
    </button>
  );
}

type BooleanSetting = {
  [K in keyof Preferences]: Preferences[K] extends boolean ? K : never;
}[keyof Preferences];

function PreferenceRow({
  icon,
  label,
  hint,
  setting,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  setting: BooleanSetting;
}) {
  const { preferences, setPreference } = usePreferences();
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
      <RowLabel icon={icon} label={label} hint={hint} />
      <Switch
        checked={preferences[setting]}
        onChange={(value) => setPreference(setting, value)}
        label={label}
      />
    </div>
  );
}
