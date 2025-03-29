# Contributing to GreyLocker Privacy Shield

Thank you for your interest in contributing to the GreyLocker Privacy Shield extension. This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to uphold our values of privacy, security, and user autonomy. We expect all contributors to respect each other and maintain a professional and inclusive environment.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** to your local machine
3. **Install dependencies** with `npm install`
4. **Create a new branch** for your feature or fix: `git checkout -b feature/your-feature-name`

## Development Setup

1. Run `npm install` to install all dependencies
2. Make your changes
3. Test the extension:
   - Load the extension in Chrome/Brave/Edge by navigating to `chrome://extensions/`, enabling "Developer mode", and clicking "Load unpacked" to select your project directory
   - Or run `npm start` to launch the extension in Firefox via web-ext

## Privacy Protection Guidelines

When contributing to GreyLocker's privacy features, please follow these principles:

1. **Zero Logging**: Never log user data or activity
2. **Permission Minimalism**: Only request the permissions absolutely necessary
3. **Fingerprinting Defense**: When adding new anti-fingerprinting measures, ensure they:
   - Add minimal noise to maintain site functionality
   - Are not detectable by anti-fingerprinting-detection mechanisms
   - Provide consistent results within a session to avoid statistical fingerprinting

4. **Performance First**: Privacy protections should have minimal impact on browsing performance

## Code Style and Structure

- Follow the existing code style in the project
- Keep functions small and focused on a single responsibility
- Document all public functions with JSDoc comments
- Use descriptive variable and function names that match the cyberpunk theme
- Use modern JavaScript features (ES6+)

## Pull Request Process

1. Update the README.md if needed with details of changes
2. Run tests if available and ensure your code lints without errors
3. Submit a pull request to the `develop` branch
4. The PR should include a description of the changes and any related issue numbers
5. Wait for a review from a core team member

## Feature Requests and Bug Reports

Please use the GitHub issue tracker to submit feature requests and bug reports. Include as much detail as possible:

- For bugs: browser version, steps to reproduce, expected vs. actual behavior
- For features: clear description of the feature, use cases, and benefits

## Security Vulnerabilities

If you discover a security vulnerability, please do NOT open an issue. Email us at darkops@greylocker.io with details about the vulnerability.

## Coding Standards

- Write self-documenting code with meaningful variable and function names
- Follow privacy-by-design principles
- Test thoroughly, especially for edge cases
- Keep browser compatibility in mind (Chrome, Firefox, Brave, Edge)

## NFT Integration Guidelines

When working with the NFT verification components:

1. Never compromise user privacy in the verification process
2. Keep the verification code separate from the privacy protection code
3. Ensure verification failures gracefully degrade to basic functionality
4. Minimize blockchain interactions to reduce latency and network footprint

---

Thank you for contributing to digital privacy in the datastream. Your code helps build the resistance.

*"In a world of surveillance, invisibility is power."*
