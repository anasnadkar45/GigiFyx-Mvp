"use client"
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import React from 'react'

const page = () => {
    return (
        <div>
            <form onSubmit={(e) => {
                e.preventDefault();
                signOut();
            }}>
                <Button>Logout</Button>
            </form>
        </div>
    )
}

export default page