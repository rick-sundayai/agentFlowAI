export default function SignUpConfirmation() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Check your email
          </h2>
        </div>
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600">
            We've sent you a confirmation email. Please check your inbox and follow the instructions to complete your registration.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            If you don't see the email, please check your spam folder.
          </p>
          <div className="mt-8">
            <a
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Return to login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
