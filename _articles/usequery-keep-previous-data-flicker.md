# 검색 필터를 바꿀 때마다 리스트가 깜빡이는 현상, 어떻게 없앨 수 있나요?

> **실무 경험에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

useQuery는 쿼리 키가 바뀌면 기존 데이터를 즉시 비워버립니다. 이 때문에 필터 조건이 바뀔 때마다 리스트 영역이 빈 상태로 잠깐 보이는 깜빡임 현상이 발생합니다. `placeholderData: keepPreviousData` 옵션을 사용하면 새 데이터를 받아오는 동안 이전 데이터를 유지해 이 현상을 없앨 수 있습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

리조트 객실 예약 시스템을 개발하던 중이었습니다. 객실 목록은 useQuery로 조회하고 있었고, 사용자가 체크인과 체크아웃 날짜를 선택하면 그 값이 쿼리스트링에 반영되면서 백엔드 API를 다시 호출하는 구조였습니다.

문제는 사용자가 날짜를 선택할 때마다 객실 리스트 영역 전체가 순간적으로 사라졌다가 다시 나타나는 현상이었습니다. 기술적으로는 당연한 동작입니다. useQuery는 쿼리 키가 변경되면 이전 쿼리의 데이터를 즉시 비우고 새 쿼리를 시작하기 때문입니다. `isLoading`이 `true`로 바뀌는 그 짧은 순간, 리스트는 빈 상태가 됩니다.

처음에는 로딩 스피너를 보여주는 방식으로 대응하려 했습니다. 하지만 사용자가 날짜를 바꿀 때마다 화면이 스피너로 교체되면 흐름이 끊기는 느낌이 납니다. 예약 플로우처럼 반복적인 조건 탐색이 많은 UX에서는 특히 거슬립니다. 이전 목록을 그대로 유지한 채 데이터를 교체하는 것이 훨씬 자연스럽다고 판단했습니다.

TanStack Query v5에서는 이 상황을 위한 옵션을 제공합니다. `placeholderData: keepPreviousData`입니다. 이 옵션을 사용하면 쿼리 키가 바뀌어 새 요청이 시작되더라도, 응답이 도착하기 전까지는 직전 쿼리의 데이터를 그대로 화면에 유지합니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { fetchRooms } from '@/api/rooms';

export default function RoomList() {
  const searchParams = useSearchParams();
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', checkIn, checkOut],
    queryFn: () => fetchRooms({ checkIn, checkOut }),
  });

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <ul>
      {data?.map((room) => (
        <li key={room.id}>{room.name}</li>
      ))}
    </ul>
  );
}
```

날짜가 바뀌면 쿼리 키가 변경됩니다. useQuery는 이전 데이터를 즉시 비우고 `isLoading`을 `true`로 설정합니다. 그 결과 리스트가 사라지고 `로딩 중...` 텍스트가 나타났다가 다시 목록으로 교체되는 깜빡임이 발생합니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { fetchRooms } from '@/api/rooms';

export default function RoomList() {
  const searchParams = useSearchParams();
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['rooms', checkIn, checkOut],
    queryFn: () => fetchRooms({ checkIn, checkOut }),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      <ul>
        {data?.map((room) => (
          <li key={room.id}>{room.name}</li>
        ))}
      </ul>
      {isPlaceholderData && <p>새로운 객실 정보를 불러오는 중입니다.</p>}
    </div>
  );
}
```

`placeholderData: keepPreviousData`를 추가하면 쿼리 키가 바뀌어도 이전 데이터가 화면에 남아 있습니다. `isLoading`은 캐시된 데이터가 전혀 없을 때만 `true`가 되기 때문에, 최초 로딩 이후부터는 스피너 없이 목록이 유지됩니다.

`isFetching`은 새 요청이 진행 중일 때 `true`가 됩니다. 이 값을 활용해 리스트 전체를 교체하는 대신 투명도(opacity)를 낮추는 방식으로, 사용자에게 데이터가 갱신 중임을 자연스럽게 알릴 수 있습니다.

`isPlaceholderData`는 현재 화면에 표시된 데이터가 이전 쿼리의 것임을 나타냅니다. 필요에 따라 갱신 중 상태 메시지나 안내 UI를 노출할 때 사용합니다.

---

#### 정리 (Conclusion)

`placeholderData: keepPreviousData`는 필터나 페이지네이션처럼 쿼리 키가 자주 바뀌는 상황에서 UX를 부드럽게 만드는 실용적인 옵션입니다.

핵심을 정리하면 다음과 같습니다.

- `placeholderData: keepPreviousData`를 설정하면 이전 쿼리 데이터를 새 데이터가 도착할 때까지 유지합니다.
- `isLoading`은 캐시된 데이터가 없는 최초 요청에서만 `true`가 됩니다.
- `isFetching`으로 갱신 중 상태를 감지하고, opacity나 안내 문구로 피드백을 줄 수 있습니다.
- `isPlaceholderData`로 현재 데이터가 이전 쿼리의 것인지 구분할 수 있습니다.

모든 상황에 정답인 방법은 아닙니다. 데이터가 완전히 바뀌는 맥락에서는 이전 데이터를 유지하는 것이 오히려 혼란을 줄 수도 있습니다. 상황에 맞게 선택하는 것이 중요합니다.

---

### 추가 학습 자료 공유합니다.

- [TanStack Query 공식 문서 — placeholderData](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries#better-paginated-queries-with-placeholderdata)
- [TanStack Query 공식 문서 — isFetching vs isLoading](https://tanstack.com/query/latest/docs/framework/react/guides/queries#fetchstatus)

---

### [ACTIONS]

```
[ 콘텐츠 피드백 ]    [ 공유하기 ]
```

---

### [FOOTER]

```
로고: 매일매일
Copyright © 2026 매일매일. All rights reserved.

Contact: kangmu238@gmail.com
Socials: / Github
```

---

## 키워드 변수 정의

| 키워드 | 값 |
|--------|----|
| `{{TITLE}}` | 검색 필터를 바꿀 때마다 리스트가 깜빡이는 현상, 어떻게 없앨 수 있나요? |
| `{{CATEGORY}}` | 실무 경험 |
| `{{TAGS}}` | React, TanStack Query, useQuery, keepPreviousData, UX |
| `{{DATE}}` | 2026-04-21 |
| `{{SLUG}}` | usequery-keep-previous-data-flicker |
| `{{SUMMARY}}` | useQuery는 쿼리 키가 바뀌면 기존 데이터를 즉시 비워버립니다. keepPreviousData로 이전 데이터를 유지해 깜빡임을 없앨 수 있습니다. |
| `{{WHY}}` | useQuery의 쿼리 키 변경 시 데이터 초기화 동작과 isLoading 전환으로 인한 깜빡임 발생 원리 |
| `{{LANG}}` | tsx |
| `{{BAD_CODE}}` | placeholderData 없는 useQuery — 날짜 변경 시 isLoading true로 전환되어 깜빡임 발생 |
| `{{BAD_CODE_EXPLAIN}}` | 쿼리 키 변경 시 이전 데이터가 즉시 비워지며 로딩 상태로 전환됨 |
| `{{GOOD_CODE}}` | placeholderData: keepPreviousData 추가 + isFetching으로 opacity 처리 |
| `{{GOOD_CODE_EXPLAIN}}` | 이전 데이터를 유지하면서 자연스러운 전환 처리 |
| `{{CONCLUSION}}` | 필터나 페이지네이션처럼 쿼리 키가 자주 바뀌는 상황에서 keepPreviousData로 UX를 개선한다. |
| `{{RESOURCE_1_TITLE}}` | TanStack Query 공식 문서 — placeholderData |
| `{{RESOURCE_1_URL}}` | https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries#better-paginated-queries-with-placeholderdata |
| `{{RESOURCE_2_TITLE}}` | TanStack Query 공식 문서 — isFetching vs isLoading |
| `{{RESOURCE_2_URL}}` | https://tanstack.com/query/latest/docs/framework/react/guides/queries#fetchstatus |
| `{{YEAR}}` | 2026 |
