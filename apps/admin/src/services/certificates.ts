import { store } from '../../../src/services/store';
import { Certificate, CertificateType } from '@packages/types/src';

export const adminCertificatesService = {
  getAll: (): Certificate[] => store.getCertificates(),
  issue: (participantId: string, eventId: string | undefined, type: CertificateType) => store.issueCertificate(participantId, eventId, type)
};
