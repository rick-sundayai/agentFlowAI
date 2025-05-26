# Testing Strategy for AgentFlow AI Co-Pilot

This document outlines the testing approach for the AgentFlow AI Co-Pilot application.

## Testing Tools

- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **Jest DOM**: Custom Jest matchers for DOM testing

## Test Structure

Tests are organized in the following structure:

```
app/
  __tests__/
    api/
      copilot-command/
        route.test.ts       # Tests for the API route
    components/
      ChatUI/
        ChatInput.test.tsx  # Tests for the ChatInput component
        ContactItem.test.tsx # Tests for the ContactItem component
        MessageBubble.test.tsx # Tests for the MessageBubble component
        TypingIndicator.test.tsx # Tests for the TypingIndicator component
      CoPilotChat.test.tsx  # Tests for the main CoPilotChat component
    context/
      ChatContext.test.tsx  # Tests for the ChatContext provider
```

## Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode (tests will re-run when files change):

```bash
npm run test:watch
```

To run tests with coverage report:

```bash
npm run test:coverage
```

## Test Coverage

The test suite aims to cover:

1. **Unit Tests**: Testing individual components and functions in isolation
2. **Integration Tests**: Testing how components work together
3. **API Tests**: Testing the backend API endpoints

## Mocking Strategy

The tests use mocks for:

- External APIs (Vertex AI/Gemini)
- Supabase client
- Browser APIs (clipboard, localStorage)
- Next.js routing

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests
2. **Readable Tests**: Tests should be easy to understand and maintain
3. **Testing Behavior**: Focus on testing component behavior rather than implementation details
4. **Accessibility**: Include tests for accessibility features
5. **Error Handling**: Test error scenarios and edge cases

## Adding New Tests

When adding new features or components:

1. Create a new test file in the appropriate directory
2. Follow the existing testing patterns
3. Ensure tests cover both success and failure scenarios
4. Mock external dependencies
5. Run the test suite to ensure all tests pass

## Continuous Integration

Tests are automatically run as part of the CI/CD pipeline to ensure code quality before deployment.
