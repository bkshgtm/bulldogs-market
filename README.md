# Bulldogs Market

A web application for AAMU's donation-based market, allowing students to browse and request free items.

## Features

- User authentication (students and staff)
- Item browsing and filtering
- Shopping cart functionality
- Order management
- Token system for item requests
- Admin dashboard for inventory management
- Responsive design

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Firebase (Authentication, Firestore, Storage)
- shadcn/ui components
- Framer Motion for animations

## Getting Started

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   \`\`\`
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The application can be deployed to Vercel:

\`\`\`bash
npm run build
\`\`\`

## License

This project is licensed under the MIT License.
