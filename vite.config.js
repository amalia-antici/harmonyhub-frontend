// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   define:{
//     global: 'window',
//   },
//   server: {
//     proxy: {
//       '/graphql': {
//         target: 'http://localhost:8080',
//         changeOrigin: true,
//         secure: false,
//       },
//       '/api': {
//         target: 'http://localhost:8080',
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(),
    basicSsl()
  ],
  define: {
    global: 'window',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: true,
    proxy: {
      '/graphql': {
        //target: 'https://10.212.192.97:8080',
        target: 'https://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        //target: 'https://10.212.192.97:8080',
        target: 'https://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/ws-events': {
        //target: 'https://10.212.192.97:8080',
        target: 'https://localhost:8080',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})