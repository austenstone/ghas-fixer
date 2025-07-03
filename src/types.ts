import type { Endpoints } from '@octokit/types';
import type { components } from '@octokit/openapi-types';

export type CodeScanningAlert = components['schemas']['code-scanning-alert'];
export type ListOrgCodeScanningAlerts = Endpoints['GET /orgs/{org}/code-scanning/alerts'];
export type ListRepoCodeScanningAlerts = Endpoints['GET /repos/{owner}/{repo}/code-scanning/alerts'];
export type CreateCodeScanningAutoFix = Endpoints['POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'];
export type CommitCodeScanningAutoFix = Endpoints['POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits'];
export type GetStatusCodeScanningAutoFix = Endpoints['GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'];

export interface SpinnerInterface {
  start: (msg?: string) => void;
  stop: (msg?: string, code?: number) => void;
  message: (msg?: string) => void;
}
