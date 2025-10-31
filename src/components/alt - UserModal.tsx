import type { MouseEvent } from 'react';
import type { User } from '../types';

interface Coordinates {
  lat?: number | string;
  lng?: number | string;
}

interface Address {
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates?: Coordinates;
}

interface Company {
  name?: string;
  title?: string;
  department?: string;
  address?: Address;
}

interface Hair {
  color?: string;
  type?: string;
}

interface Bank {
  cardType?: string;
  cardNumber?: string;
  cardExpire?: string;
  currency?: string;
  iban?: string;
}

interface Crypto {
  coin?: string;
  wallet?: string;
  network?: string;
}

interface ExtendedUser extends User {
  username?: string;
  role?: string;
  age?: number;
  birthDate?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  eyeColor?: string;
  hair?: Hair;
  ip?: string;
  macAddress?: string;
  university?: string;
  company?: Company;
  bank?: Bank;
  crypto?: Crypto;
  ein?: string;
  ssn?: string;
  userAgent?: string;
  address?: Address;
}

interface AltUserModalProps {
  user: ExtendedUser | null;
  isOpen: boolean;
  onClose: () => void;
}

function AltUserModal({ user, isOpen, onClose }: AltUserModalProps): JSX.Element | null {
  if (!isOpen || !user) return null;

  const rows: string[] = [];

  const pushRow = (label: string, value: unknown) => {
    if (value === undefined || value === null) return;
    const text = String(value).trim();
    if (!text) return;
    rows.push(
      `<div class="kv">` +
      `<div class="label">${label}</div>` +
      `<div class="value">${text}</div>` +
      '</div>'
    );
  };

  pushRow('ID', user.id);
  pushRow('Username', user.username);
  pushRow('Role', user.role);
  pushRow('Age', user.age);
  pushRow('Birth date', user.birthDate);
  pushRow('Blood group', user.bloodGroup);
  pushRow('Height', user.height);
  pushRow('Weight', user.weight);
  pushRow('Eye color', user.eyeColor);
  pushRow('Hair color', user.hair?.color);
  pushRow('Hair type', user.hair?.type);
  pushRow('IP', user.ip);
  pushRow('MAC address', user.macAddress);
  pushRow('University', user.university);

  pushRow('Company', user.company?.name);
  pushRow('Title', user.company?.title);
  pushRow('Company dept', user.company?.department);
  const companyAddress = user.company?.address;
  if (companyAddress) {
    const addressParts = [
      companyAddress.address,
      companyAddress.city,
      companyAddress.state,
      companyAddress.postalCode
    ].filter(Boolean);
    pushRow('Company address', addressParts.join(', '));
    pushRow('Company country', companyAddress.country);
    pushRow('Company lat', companyAddress.coordinates?.lat);
    pushRow('Company lng', companyAddress.coordinates?.lng);
  }

  pushRow('Bank type', user.bank?.cardType);
  pushRow('Card number', user.bank?.cardNumber);
  pushRow('Card expire', user.bank?.cardExpire);
  pushRow('Currency', user.bank?.currency);
  pushRow('IBAN', user.bank?.iban);

  pushRow('Coin', user.crypto?.coin);
  pushRow('Wallet', user.crypto?.wallet);
  pushRow('Network', user.crypto?.network);

  pushRow('EIN', user.ein);
  pushRow('SSN', user.ssn);
  pushRow('User agent', user.userAgent);

  const handleOverlayClick = () => {
    onClose();
  };

  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="modal" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={handleContentClick}>
        <span className="close" onClick={onClose} role="button" tabIndex={0}>
          &times;
        </span>
        <img id="modal-image" src={user.image ?? ''} alt={user.firstName} />
        <h2>
          {user.firstName} {user.lastName}
        </h2>
        <p>Email: {user.email}</p>
        <p>Phone: {user.phone}</p>
        <p>Gender: {user.gender ?? ''}</p>
        <p>Department: {user.company?.department ?? 'Unknown'}</p>
        <p>
          Address: {user.address?.address}, {user.address?.city}
        </p>
        <div className="modal-extra" dangerouslySetInnerHTML={{ __html: rows.join('') }} />
      </div>
    </div>
  );
}

export default AltUserModal;

