/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {},
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})(nextConfig);
