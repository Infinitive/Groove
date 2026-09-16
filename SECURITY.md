# Security Policy

## Supported Versions

The latest version of the `main` branch is the only actively maintained version of Groove.

Because Groove is a personal, local-first application, older releases may not receive security updates.

| Version        | Supported |
| -------------- | --------- |
| Latest `main`  | Yes       |
| Older releases | No        |

## Reporting a Vulnerability

Please do not publicly disclose security vulnerabilities through a GitHub Issue, pull request, or discussion.

If GitHub's private vulnerability reporting feature is available for this repository, please use it to report the vulnerability privately.

When reporting a vulnerability, please include:

* A clear description of the issue
* The affected component or file
* Steps to reproduce the issue
* The potential security impact
* Any suggested mitigation, if known

Please avoid including passwords, API keys, personal data, or other sensitive information in the report.

## Scope

Groove is designed as a local-first Progressive Web App.

The application's core collection data is stored locally in the browser using IndexedDB. The project does not intentionally require:

* User accounts
* A hosted application backend
* A remote database
* Cloud synchronization
* Gemini or other generative-AI services
* Permanent Internet connectivity

Security reports concerning third-party dependencies, the GitHub Pages deployment, or the application source code are welcome.

## Disclosure

Please allow reasonable time for investigation and remediation before publicly disclosing a vulnerability.

There is no guaranteed response or remediation time for reports.

Thank you for helping keep Groove safe.
