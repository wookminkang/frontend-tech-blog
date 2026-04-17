'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'maeilmaeil_modal_hidden_until';

export default function HomeModal() {
  const [visible, setVisible] = useState(false);
  const [doNotShowToday, setDoNotShowToday] = useState(false);

  useEffect(() => {
    const hiddenUntil = localStorage.getItem(STORAGE_KEY);
    if (hiddenUntil && new Date().toDateString() === hiddenUntil) return;
    setVisible(true);
  }, []);

  function handleClose() {
    if (doNotShowToday) {
      localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        }}
      >
        {/* 상단 배너 */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1a00 100%)',
            padding: '32px 28px 28px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 70% 50%, rgba(254,110,0,0.3) 0%, transparent 70%)',
            }}
          />
          <div style={{ position: 'relative' }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: '#fe6e00',
                marginBottom: 10,
              }}
            >
              매일매일
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.3,
                letterSpacing: '-0.5px',
              }}
            >
              매일 하나씩,<br />
              함께 성장해요.
            </p>
          </div>
        </div>

        {/* 본문 */}
        <div style={{ padding: '28px 28px 24px' }}>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.8,
              color: '#444',
            }}
          >
            이 웹사이트는 AI를 활용해 제작되었고, 다양한 지식을 여러분과 함께 나누기 위해 만들었어요.
          </p>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.8,
              color: '#444',
              marginTop: 12,
            }}
          >
            매일 자동으로 새로운 글이 작성되니, 하나씩 가볍게 확인하시면서 자연스럽게 학습하는 습관을 만들어보세요.
          </p>

          {/* 구분선 */}
          <div style={{ borderTop: '1px solid #F0F0F0', margin: '24px 0 20px' }} />

          {/* 하단 액션 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#757575',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={doNotShowToday}
                onChange={(e) => setDoNotShowToday(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: '#fe6e00',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
              오늘 하루 보지 않기
            </label>

            <button
              onClick={handleClose}
              style={{
                flexShrink: 0,
                height: 38,
                padding: '0 22px',
                background: '#fe6e00',
                color: '#fff',
                border: 'none',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              확인했어요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
