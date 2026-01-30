# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take security seriously at ralph-starter. If you discover a security vulnerability, please follow these steps:

### Do NOT

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Do

1. **Email us directly** at ruben@rubenmarcus.dev (or open a private security advisory on GitHub)
2. Include as much detail as possible:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution Timeline**: Depends on severity, typically 30-90 days

### Severity Levels

| Level | Description | Target Resolution |
|-------|-------------|-------------------|
| Critical | Remote code execution, credential theft | 7 days |
| High | Data exposure, authentication bypass | 14 days |
| Medium | Limited data exposure, DoS | 30 days |
| Low | Minor issues, hardening | 90 days |

## Credential Handling

ralph-starter handles sensitive credentials including:

- **API Keys**: Linear, Notion, GitHub, Todoist
- **OAuth Tokens**: Various integrations
- **LLM API Keys**: Anthropic, OpenAI, OpenRouter

### How We Protect Credentials

1. **Local Storage**: Credentials are stored in `~/.ralph-starter/` with restricted permissions
2. **No Telemetry**: We do not collect or transmit your credentials
3. **No Logging**: Credentials are never logged or included in error reports
4. **Memory Only**: OAuth tokens are handled in memory during authentication flows

### Best Practices for Users

1. Use environment variables when possible (`ANTHROPIC_API_KEY`, etc.)
2. Never commit `.ralph-starter/` directory
3. Use GitHub CLI (`gh`) instead of personal access tokens when possible
4. Regularly rotate API keys
5. Use tokens with minimal required scopes

## Security Updates

Security updates are released as patch versions (e.g., 0.1.1 -> 0.1.2) and announced via:

- GitHub Releases
- npm package updates

We recommend always using the latest version.

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who report valid vulnerabilities (with permission) in our release notes.
