'use client'
import './styles/sb-admin-2.css'
import './styles/gg-editable-dropdown.css'
import './styles/tags-input.css'
import './styles/global.css'

import * as RootState from './components/states/RootState'
import { PageRelatedContextWrapper } from './components/states/PageRelatedState'




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"></link>
      </head>
      <body>
        <RootState.RootPageStateWrapper>
                <PageRelatedContextWrapper>            
                        {children}
                </PageRelatedContextWrapper>
            </RootState.RootPageStateWrapper>
      </body>
    </html>
  );
}
