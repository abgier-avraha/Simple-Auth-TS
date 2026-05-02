import Image from "next/image";
import { LoginButton } from "./_components/login-button";
import { LoginInfo } from "./_components/login-info";

// TODO: add logout

export default async function Home() {

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert mb-4"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <LoginButton />
        </div>

        <LoginInfo />
      </main>
    </div>
  );
}
