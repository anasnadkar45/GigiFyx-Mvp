import React from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'

const Header = () => {
  return (
    <div>
      <div>
        GigiFyx
      </div>
      <Link href={'/sign-in'}>
        <Button>
          Get Started
        </Button>
      </Link>
    </div>
  )
}

export default Header