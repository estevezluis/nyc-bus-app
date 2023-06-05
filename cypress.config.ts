import { defineConfig } from 'cypress'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const { MAPBOX_ACCESS_TOKEN } = process.env
export default defineConfig({
	env: {
		MAPBOX_ACCESS_TOKEN,
	},
	video: false,
	e2e: {
		supportFile: false,
	},
})
