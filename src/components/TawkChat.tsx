'use client';

import { useFeatureFlag } from '@/providers/LaunchDarklyProvider';
import Script from 'next/script';

export default function TawkChat() {
  const isEnabled = useFeatureFlag('tawk-chat-enabled', false);

  if (!isEnabled) {
    return null;
  }

  return (
    <Script id="tawk-chat-script" strategy="afterInteractive">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
        Tawk_API.customStyle = {
            visibility : {
                desktop : {
                    position : 'br',
                    xOffset : '20px',
                    yOffset : '20px'
                },
                mobile : {
                    position : 'br',
                    xOffset : '10px',
                    yOffset : '10px'
                }
            }
        };
        (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/69f5168d8523f61c32f23cfd/1jnim06b2';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  );
}
