import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface JWT {
    accessToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user repo workflow",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT & { accessToken?: string } }) {
      // Send properties to the client
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
}; 