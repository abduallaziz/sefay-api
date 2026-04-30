import { SetMetadata } from '@nestjs/common'
import { SKIP_ONBOARDING_CHECK } from '../guards/onboarding.guard'

export const SkipOnboarding = () => SetMetadata(SKIP_ONBOARDING_CHECK, true)