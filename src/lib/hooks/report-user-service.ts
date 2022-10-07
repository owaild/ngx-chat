import { InjectionToken } from '@angular/core';
import { Contact } from '../services/adapters/xmpp/core/contact';

/**
 * Optional injectable token to handle contact reports in the chat
 */
export const REPORT_USER_INJECTION_TOKEN = new InjectionToken<ReportUserService>('ngxChatReportUserService');

export interface ReportUserService {

    reportUser(user: Contact): void;

}
