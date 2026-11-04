/* wordBank.js — 국립국어원 한국수어사전에서 확인한 단어 수어.
 *
 * 출처: 국립국어원 한국수어사전 https://sldict.korean.go.kr/
 *   `원문` 은 사전의 수형 설명을 고치지 않고 옮긴 것이다(CC BY-NC-ND 2.0 KR).
 *   그 밖의 칸(단계, 수형·수향·수위·수동, 판정 힌트)은 원문과 수형 사진을 읽고
 *   손말이 풀어 쓴 것이다. 사전의 그림이나 사진은 싣지 않는다.
 *
 * 사전의 손가락 번호
 *   1지 검지, 2지 중지, 3지 약지, 4지 새끼, 5지 엄지.
 *   '너'(1지를 펴서 내민다), '잘하다'(5지를 펴서 세운다), '괜찮다'(4지 끝을 턱에)로 맞춰 확인했다.
 *
 * 그림이 아직 없는 단어는 화면에 나오지 않는다. 그림이 들어오면 words.js 가 여기서 가져간다.
 * 임시그림 (있으면) 코덱스가 다시 그려야 하는 임시 그림이라는 표시. 이유와 할 일을 적는다.
 * status
 *   'ok'      사전 항목과 뜻이 분명하다
 *   'check'   항목은 찾았지만 뜻이나 쓰임을 사람이 한 번 더 봐야 한다
 *
 * check (판정 힌트, 단계마다)
 *   hands  보여야 하는 손 수
 *   fingers 주로 쓰는 손에서 펴진 손가락 (index·middle·ring·pinky, thumb 은 따로)
 *   zone   손이 머무는 곳 face · chin · chest · belly · front
 */

const SL = no => `https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no=${no}`;
const e = (no, fields) => ({ entryNo: String(no), sourceUrl: SL(no), source: '국립국어원 한국수어사전', ...fields });

/** @type {Array<object>} */
export const WORD_BANK = [
  /* ── 기본 ── 지금 화면의 12개를 사전 기준으로 다시 세운 것 */
  e(3331, { word: '안녕하세요', category: '기본', aliases: ['안녕','안녕하십니까','반갑습니다'], status: 'ok',
    원문: '오른 손바닥으로 주먹을 쥔 왼 팔을 쓸어내린 다음, 두 주먹을 쥐고 바닥이 아래로 향하게하여 가슴 앞에서 아래로 내린다.',
    결합: '잘+머무르다', hands: 2,
    수형: '왼손 주먹, 오른손 편 손 → 두 손 주먹', 수향: '주먹 바닥이 아래', 수위: '왼팔 위 → 가슴 앞', 수동: '왼팔을 쓸어내린 뒤 두 주먹을 아래로 내린다',
    steps: ['왼 주먹을 쥐고 오른 손바닥을 왼 팔꿈치 쪽 팔등에 댄다', '오른 손바닥으로 왼 팔등을 따라 손목 쪽까지 쓸어내린다', '두 주먹을 가슴 앞에서 아래로 내린다'],
    check: [{ hands: 2, fingers: ['index','middle','ring','pinky'], other: [], zone: 'front' }, { hands: 2, fingers: ['index','middle','ring','pinky'], other: [], zone: 'front' }, { hands: 2, fingers: [], zone: 'chest' }] }),

  e(2372, { word: '감사합니다', category: '기본', aliases: ['고맙습니다','감사','고마워요','고맙다'], status: 'ok',
    원문: '손끝이 밖으로 향하게 펴서 모로 세운 오른손의 4지 옆면을 손바닥이 아래로 향하게 편 왼 손등에 두 번 댄다.',
    hands: 2,
    수형: '두 손 모두 편 손', 수향: '왼손은 손바닥이 아래, 오른손은 엄지가 위로 오게 옆으로 세움', 수위: '가슴 앞', 수동: '오른손 새끼 쪽 옆면으로 왼 손등을 두 번 친다',
    steps: ['왼손은 손바닥이 아래로 펴고, 오른손은 엄지가 위로 오게 세워 새끼손가락 쪽 옆면이 아래를 향하게 한다', '오른손 새끼 쪽 옆면을 왼 손등에 두 번 댄다'],
    check: [{ hands: 2, fingers: ['index','middle','ring','pinky'], zone: 'chest' }, { hands: 2, fingers: ['index','middle','ring','pinky'], zone: 'chest' }] }),

  e(9917, { word: '미안합니다', category: '기본', aliases: ['미안','미안해요','죄송합니다','죄송해요','미안하다'], status: 'ok',
    원문: '오른손의 1·5지 끝을 맞대어 동그라미를 만들어 이마에 댔다가 1·5지를 펴며, 손등이 위로 손끝이 오른쪽으로 향하게 편 왼 손등에 내려놓는다.',
    hands: 2,
    수형: '검지와 엄지 동그라미 → 편 손', 수향: '왼손은 손등이 위', 수위: '이마 → 왼 손등', 수동: '이마에서 내려 손가락을 펴며 왼 손등에 얹는다',
    steps: ['검지와 엄지로 동그라미를 만들어 이마에 댄다', '손을 펴며 내려 왼 손등 위에 얹는다'],
    check: [{ hands: 1, ring: true, zone: 'face' }, { hands: 2, fingers: ['index','middle','ring','pinky'], zone: 'chest' }] }),

  e(9466, { word: '괜찮아요', category: '기본', aliases: ['괜찮다','괜찮습니다','괜찮아'], status: 'ok',
    원문: '오른 주먹의 4지를 펴서 끝 바닥을 턱에 가볍게 두 번 댄다.',
    hands: 1,
    수형: '새끼손가락만 편 주먹', 수향: '손바닥이 안쪽', 수위: '턱', 수동: '새끼손가락 끝을 턱에 두 번 댄다',
    steps: ['주먹에서 새끼손가락만 편다', '새끼손가락 끝을 턱에 가볍게 두 번 댄다'],
    check: [{ hands: 1, fingers: ['pinky'], zone: 'chin' }, { hands: 1, fingers: ['pinky'], zone: 'chin' }] }),

  e(9474, { word: '네', category: '기본', aliases: ['예'], status: 'ok',
    원문: '오른 주먹의 1·2·4지를 펴서 등이 밖으로 향하게 벌려 1·2지 끝을 오른쪽 눈 옆에 댄다.',
    메모: '대답하는 \'예\'로 판단한 근거 셋. 손모양이 지문자 ㅖ(검지, 중지, 새끼를 펴고 손등이 밖)와 같아 글자 \'예\'를 손모양으로 삼은 수어다. '
      + '사전 분류가 사회생활(인사, 예절 표현이 있는 갈래)이다. 같은 글자의 다른 뜻인 \'보기, 예시\'는 따로 표제어(18633 비유,보기)가 있다. 2026-11-02 확인.',
    hands: 1,
    수형: '검지와 중지, 새끼를 편 손', 수향: '손등이 밖', 수위: '오른쪽 눈 옆', 수동: '검지와 중지 끝을 눈 옆에 댄다',
    steps: ['검지와 중지, 새끼를 펴서 검지와 중지 끝을 오른쪽 눈 옆에 댄다'],
    check: [{ hands: 1, fingers: ['index','middle','pinky'], zone: 'face' }] }),

  e(24036, { word: '아니요', category: '기본', aliases: ['아니','아닙니다','아니에요','아니다'], status: 'ok',
    원문: '손바닥이 밖으로 향하게 세운 오른손을 좌우로 흔든다.',
    hands: 1,
    수형: '편 손', 수향: '손바닥이 밖', 수위: '가슴 앞', 수동: '좌우로 흔든다',
    steps: ['손바닥이 앞을 보게 편 손을 세운다', '좌우로 흔든다'],
    check: [{ hands: 1, fingers: ['index','middle','ring','pinky'], zone: 'chest' }, { hands: 1, fingers: ['index','middle','ring','pinky'], zone: 'chest' }] }),

  e(5447, { word: '도와주세요', category: '기본', aliases: ['도와줘','도움','돕다','도와주다'], status: 'ok',
    원문: '왼 주먹의 5지를 펴서 바닥이 밖으로 향하게 세우고, 그 등에 오른 손바닥을 세워 두 번 댄다.',
    hands: 2,
    수형: '왼손 엄지 세운 주먹, 오른손 편 손', 수향: '왼 엄지 바닥이 밖, 오른손 세움', 수위: '가슴 앞', 수동: '오른 손바닥으로 왼 엄지 등을 두 번 댄다',
    steps: ['왼손은 엄지를 세운 주먹, 오른손은 펴서 세운다', '오른 손바닥을 왼 엄지 등에 두 번 댄다'],
    check: [{ hands: 2, fingers: ['index','middle','ring','pinky'], other: [], thumb: null, zone: 'chest' }, { hands: 2, fingers: ['index','middle','ring','pinky'], other: [], zone: 'chest' }] }),

  e(7422, { word: '다시', category: '기본', aliases: ['또','다시요','한번더','그리고'], status: 'ok',
    원문: '오른 주먹의 5지 바닥을 1·2지의 손톱에 가볍게 대고 손등이 밖으로 향하게 하여 왼쪽 아래로 내리며 1·2지를 편다.',
    hands: 1,
    수형: '엄지로 검지와 중지 손톱을 누른 주먹 → 검지와 중지 편 손', 수향: '손등이 밖', 수위: '오른쪽 어깨 앞 → 가슴 앞', 수동: '왼쪽 아래로 내리며 검지와 중지를 튕겨 편다',
    steps: ['엄지로 검지와 중지 손톱을 누르고 어깨 앞에 든다', '왼쪽 아래로 내리며 검지와 중지를 편다'],
    check: [{ hands: 1, fingers: [], zone: 'front' }, { hands: 1, fingers: ['index','middle'], zone: 'chest' }] }),

  e(9928, { word: '천천히', category: '기본', aliases: ['느리게','천천','늦다','느리다'], status: 'ok',
    원문: '손등이 위로 향하게 편 왼 손등에 오른손을 모로 세워 천천히 밖으로 내민다.',
    hands: 2,
    수형: '두 손 모두 편 손', 수향: '왼손은 손등이 위, 오른손은 엄지가 위로 오게 옆으로 세움', 수위: '가슴 앞', 수동: '왼 손등 위에서 오른손을 천천히 앞으로 민다',
    steps: ['오른손을 엄지가 위로 오게 옆으로 세워, 새끼손가락 쪽 옆면을 왼 손등 위에 얹는다', '오른손을 천천히 앞으로 내민다'],
    check: [{ hands: 2, fingers: ['index','middle','ring','pinky'], zone: 'chest' }, { hands: 2, fingers: ['index','middle','ring','pinky'], zone: 'front' }] }),

  e(5993, { word: '이해했어요', category: '기본', aliases: ['이해','알겠어요','알았어요','납득'], status: 'ok',
    원문: '왼 주먹의 1·2지를 펴서 끝이 오른쪽으로 등이 밖으로 향하게 벌린 다음, 그 사이로 오른 주먹의 1지를 펴서 끝을 안에서 밖으로 내밀었다가 다시 밖에서 안으로 밀어 넣는다.',
    hands: 2,
    수형: '왼손 검지와 중지 벌린 손, 오른손 검지 편 손', 수향: '왼손 등이 밖', 수위: '가슴 앞', 수동: '오른 검지를 왼손 두 손가락 사이로 내밀었다 넣는다',
    steps: ['왼손 검지와 중지를 옆으로 벌려 든다', '그 사이로 오른 검지를 내밀었다가 다시 넣는다'],
    check: [{ hands: 2, fingers: ['index'], other: ['index','middle'], zone: 'chest' }, { hands: 2, fingers: ['index'], other: ['index','middle'], zone: 'chest' }] }),

  e(10981, { word: '물', category: '기본', aliases: ['물좀','식수'], status: 'ok',
    원문: '오른 주먹의 1·5지를 펴서 구부려 입으로 약간 기울여 올린다.',
    hands: 1,
    수형: '검지와 엄지를 구부린 C 모양', 수향: '손바닥이 옆', 수위: '입', 수동: '컵을 기울이듯 입으로 올린다',
    steps: ['검지와 엄지를 구부려 컵을 쥔 모양을 만든다', '입으로 기울여 올린다'],
    check: [{ hands: 1, fingers: ['index'], zone: 'chin' }, { hands: 1, fingers: ['index'], zone: 'face' }] }),

  e(971, { word: '화장실', category: '기본', aliases: ['화장실어디','변소'], status: 'ok',
    원문: '오른손을 펴서 손바닥이 밖으로 향하게 세워 2·3·4지를 벌리고 1·5지를 ‘C’자 모양으로 구부린다.',
    결합: '영어 지문자 W/영어 지문자 C', hands: 1,
    수형: '중지, 약지, 새끼를 벌려 펴고 검지와 엄지는 C', 수향: '손바닥이 밖', 수위: '가슴 앞', 수동: '없음',
    steps: ['중지, 약지, 새끼를 벌려 펴고 검지와 엄지를 C자로 구부린다'],
    check: [{ hands: 1, fingers: ['middle','ring','pinky'], zone: 'chest' }] }),

  /* ── 감정 ── */
  e(9387, { word: '배고파요', category: '감정', aliases: ['배고프다','배고파','배고픔','시장','굶다'], status: 'ok',
    원문: '자연스럽게 편 두 손의 5지 등을 배에 대고 5지 바닥에 나머지 손가락을 모아대고 누르면서 몸을 약간 구부린다.',
    hands: 2,
    수형: '편 손 → 엄지에 네 손가락을 모은 손', 수향: '엄지 등이 배', 수위: '배', 수동: '네 손가락을 엄지 쪽으로 모아 누르며 몸을 숙인다',
    비수지: '배고픈 표정',
    steps: ['두 손 엄지 등을 배에 댄다', '네 손가락을 엄지로 모아 누르며 몸을 조금 숙인다'],
    check: [{ hands: 2, zone: 'belly' }, { hands: 2, zone: 'belly' }] }),

  e(1086, { word: '화나요', category: '감정', aliases: ['화나다','화나','화내다','성나다','노엽다'], status: 'ok',
    원문: '오른 주먹의 5지를 펴서 세워 배에서 위로 약간 힘주어 올린다.',
    hands: 1,
    수형: '엄지를 세운 주먹', 수향: '손바닥이 안', 수위: '배 → 가슴', 수동: '힘주어 위로 올린다', 비수지: '화난 표정',
    steps: ['엄지를 세운 주먹을 배 앞에 둔다', '힘주어 가슴 쪽으로 올린다'],
    check: [{ hands: 1, fingers: [], thumb: 'up', zone: 'belly' }, { hands: 1, fingers: [], thumb: 'up', zone: 'chest' }] }),

  e(7240, { word: '슬퍼요', category: '감정', aliases: ['슬프다','슬퍼','슬픔','서러워요'], status: 'ok',
    원문: '오른 주먹의 1·5지를 펴서 끝을 맞대어 오른쪽 눈 밑에 댔다가 내린 다음, 손가락을 펴서 구부려 가슴에 대고 왼쪽으로 돌린다.',
    결합: '울다+괴롭다', hands: 1,
    수형: '검지와 엄지 끝 맞댐 → 구부린 손', 수향: '손바닥이 안', 수위: '눈 밑 → 가슴', 수동: '눈 밑에서 내린 뒤 가슴에서 왼쪽으로 돌린다', 비수지: '슬픈 표정',
    steps: ['검지와 엄지 끝을 맞대어 오른쪽 눈 밑에 댔다가 내린다', '손가락을 펴서 구부려 가슴에 대고 돌린다'],
    check: [{ hands: 1, ring: true, zone: 'face' }, { hands: 1, zone: 'chest' }] }),

  e(3874, { word: '기뻐요', category: '감정', aliases: ['기쁘다','기뻐','기쁨','즐거워요'], status: 'ok',
    원문: '두 주먹의 1·5지를 펴고 손등이 밖으로 향하게 하여 1지 끝을 양쪽 가슴 앞에 대고 상하로 두 번 엇갈리게 움직인다.',
    hands: 2,
    수형: '검지와 엄지를 편 손 (ㄱ 모양)', 수향: '손등이 밖', 수위: '양쪽 가슴', 수동: '두 손을 위아래로 엇갈리게 두 번', 비수지: '기쁜 표정',
    steps: ['두 손 검지와 엄지를 펴서 검지 끝을 양쪽 가슴에 댄다', '두 손을 위아래로 엇갈리게 움직인다 (두 번)'],
    check: [{ hands: 2, fingers: ['index'], thumb: 'out', zone: 'chest' }, { hands: 2, fingers: ['index'], thumb: 'out', zone: 'chest' }] }),

  e(9078, { word: '좋아요', category: '감정', aliases: ['좋다','좋아','선'], status: 'ok',
    원문: '오른 주먹을 코에 1·5지 옆면이 닿게 댄다.',
    hands: 1,
    수형: '주먹', 수향: '엄지와 검지 쪽이 코', 수위: '코', 수동: '코에 댄다',
    steps: ['주먹의 엄지와 검지 쪽 옆면을 코에 댄다'],
    check: [{ hands: 1, fingers: [], zone: 'face' }] }),

  e(23960, { word: '싫어요', category: '감정', aliases: ['싫다','싫어','거절','거부'], status: 'ok',
    원문: '오른 주먹의 1·5지를 펴서 약간 구부려 끝을 턱에 댄다.',
    hands: 1,
    수형: '검지와 엄지를 약간 구부린 손', 수향: '손끝이 턱', 수위: '턱', 수동: '턱에 댄다', 비수지: '고개를 젓는다',
    steps: ['검지와 엄지를 약간 구부려 끝을 턱에 댄다'],
    check: [{ hands: 1, fingers: ['index'], zone: 'chin' }] }),

  e(10967, { word: '무서워요', category: '감정', aliases: ['무섭다','무서워','겁나요','두려워요'], status: 'ok',
    원문: '두 손의 5지 끝을 몸 중앙의 위와 아래에 대고 손가락을 흔든다.',
    hands: 2,
    수형: '편 손', 수향: '손바닥이 안', 수위: '몸 가운데 위아래', 수동: '엄지 끝을 몸에 대고 손가락을 떤다', 비수지: '겁먹은 표정',
    steps: ['두 손 엄지 끝을 몸 가운데 위아래에 대고 손가락을 떤다'],
    check: [{ hands: 2, fingers: ['index','middle','ring','pinky'], zone: 'chest' }] }),

  e(12438, { word: '피곤해요', category: '감정', aliases: ['피곤하다','피곤해','피로'], status: 'ok',
    원문: '두 손바닥을 양쪽 가슴에 댔다가 힘없이 밑으로 내린다.',
    hands: 2,
    수형: '편 손', 수향: '손바닥이 가슴', 수위: '양쪽 가슴 → 아래', 수동: '힘없이 내린다', 비수지: '지친 표정',
    steps: ['두 손바닥을 양쪽 가슴에 댄다', '힘없이 밑으로 내린다'],
    check: [{ hands: 2, fingers: ['index','middle','ring','pinky'], zone: 'chest' }, { hands: 2, zone: 'belly' }] }),

  e(5621, { word: '아파요', category: '감정', aliases: ['아프다','아파','편찮다'], status: 'ok',
    원문: '손바닥이 위로 향하게 약간 오므린 오른손을 좌우로 흔든다.',
    hands: 1,
    수형: '약간 오므린 손', 수향: '손바닥이 위', 수위: '가슴 앞', 수동: '좌우로 흔든다', 비수지: '아픈 표정',
    steps: ['손바닥이 위로 오게 약간 오므린 손을 좌우로 흔든다'],
    check: [{ hands: 1, zone: 'chest' }] }),

  e(2336, { word: '놀랐어요', category: '감정', aliases: ['놀라다','놀라','깜짝'], status: 'ok',
    원문: '1·5지 끝을 맞댄 오른손을 가슴에 대고 같은 모양의 왼손을 그 밑에 대면서 놀라는 표정을 지으며 두 손을 동시에 편다.',
    hands: 2,
    수형: '검지와 엄지 끝 맞댄 손 → 편 손', 수향: '손바닥이 아래', 수위: '가슴', 수동: '두 손을 동시에 확 편다', 비수지: '놀란 표정',
    steps: ['검지와 엄지 끝을 맞댄 두 손을 가슴 앞에 위아래로 둔다', '놀란 표정으로 두 손을 동시에 편다'],
    check: [{ hands: 2, ring: true, zone: 'chest' }, { hands: 2, fingers: ['index','middle','ring','pinky'], zone: 'chest' }] }),

  e(10223, { word: '행복해요', category: '감정', aliases: ['행복','행복하다','행복해','복'], status: 'ok',
    원문: '오른손의 1·2·3·4지 바닥을 왼쪽 볼에 5지 바닥을 오른쪽 볼에 댔다가 내리며 손가락을 모아 붙인다.',
    hands: 1,
    수형: '편 손 → 손끝을 모은 손', 수향: '손바닥이 안', 수위: '양 볼 → 턱 아래', 수동: '턱을 감싸듯 쓸어내리며 손가락을 모은다', 비수지: '밝은 표정',
    steps: ['엄지는 오른쪽 볼, 네 손가락은 왼쪽 볼에 댄다', '내리며 손가락을 모아 붙인다'],
    check: [{ hands: 1, zone: 'chin' }, { hands: 1, zone: 'chest' }] }),

  e(5127, { word: '걱정돼요', category: '감정', aliases: ['걱정','걱정하다','걱정돼','근심','염려'], status: 'ok',
    원문: '약간 구부린 오른 손끝을 가슴에 대고 왼쪽으로 강하게 천천히 두 바퀴 돌린다.',
    hands: 1,
    수형: '약간 구부린 손', 수향: '손끝이 가슴', 수위: '가슴', 수동: '왼쪽으로 천천히 두 바퀴', 비수지: '걱정하는 표정',
    steps: ['약간 구부린 손끝을 가슴에 대고 천천히 두 바퀴 돌린다'],
    check: [{ hands: 1, zone: 'chest' }] }),

  /* ── 지시어 ── */
  e(11536, { word: '나', category: '지시어', aliases: ['내','제','저는','나는'], status: 'ok',
    원문: '오른 손바닥을 가슴 중앙에 댄다.',
    hands: 1, 수형: '편 손', 수향: '손바닥이 가슴', 수위: '가슴 가운데', 수동: '댄다',
    steps: ['오른 손바닥을 가슴 가운데에 댄다'],
    check: [{ hands: 1, fingers: ['index','middle','ring','pinky'], zone: 'chest' }] }),

  e(6450, { word: '너', category: '지시어', aliases: ['네가','자네','당신'], status: 'ok',
    원문: '오른 주먹의 1지를 펴서 끝이 밖으로 향하게 하여 약간 내민다.',
    hands: 1, 수형: '검지만 편 주먹', 수향: '검지 끝이 상대', 수위: '가슴 앞', 수동: '상대 쪽으로 약간 내민다',
    steps: ['검지로 상대를 가리키며 약간 내민다'],
    check: [{ hands: 1, fingers: ['index'], zone: 'front' }] }),

  e(8265, { word: '우리', category: '지시어', aliases: ['저희'], status: 'ok',
    원문: '오른 손바닥을 가슴에 댔다가 손등이 위로 향하게 하여 오른쪽으로 한 바퀴 크게 돌린다.',
    hands: 1, 수형: '편 손', 수향: '가슴 → 손등이 위', 수위: '가슴 → 몸 앞', 수동: '오른쪽으로 크게 한 바퀴',
    steps: ['오른 손바닥을 가슴에 댄다', '손등이 위로 오게 몸 앞에서 크게 한 바퀴 돌린다'],
    check: [{ hands: 1, fingers: ['index','middle','ring','pinky'], zone: 'chest' }, { hands: 1, fingers: ['index','middle','ring','pinky'], zone: 'belly' }] }),

  e(8472, { word: '여기', category: '지시어', aliases: ['이곳','이쪽','이거','이것'], status: 'ok',
    원문: '오른 주먹의 1지를 펴서 끝이 약간 아래로 향하게 하여 약간 내린다.',
    hands: 1, 수형: '검지만 편 주먹', 수향: '검지 끝이 약간 아래', 수위: '몸 앞', 수동: '약간 내린다',
    steps: ['검지 끝이 약간 아래를 보게 하여 내린다'],
    check: [{ hands: 1, fingers: ['index'], zone: 'front' }] }),

  e(11234, { word: '그', category: '지시어', aliases: [], status: 'check',
    원문: '왼 주먹의 5지를 펴서 바닥이 밖으로 향하게 세우고, 그 등을 오른 주먹의 1지를 펴서 끝으로 가리킨다',
    메모: '사전 표제어는 관형사 \'그\'다. \'그것\'·\'거기\'로 써도 되는지는 확인이 필요하다.',
    hands: 2, 수형: '왼손 엄지 세운 주먹, 오른손 검지', 수향: '왼 엄지 바닥이 밖', 수위: '가슴 앞', 수동: '오른 검지로 왼 엄지 등을 가리킨다',
    steps: ['왼손 엄지를 세우고 오른 검지로 그 등을 가리킨다'],
    check: [{ hands: 2, fingers: ['index'], other: [], zone: 'chest' }] }),

  /* ── 묻는 말 ── */
  e(7224, { word: '무엇', category: '묻는 말', aliases: ['뭐','무슨','어느','어떤'], status: 'ok',
    원문: '오른 주먹의 1지를 펴서 바닥이 밖으로 향하게 세워 좌우로 두 번 흔든다.',
    hands: 1, 수형: '검지만 편 주먹', 수향: '검지 바닥이 밖', 수위: '가슴 앞', 수동: '좌우로 두 번 흔든다', 비수지: '묻는 표정',
    steps: ['검지를 세워 좌우로 두 번 흔든다'],
    check: [{ hands: 1, fingers: ['index'], zone: 'chest' }] }),

  e(8799, { word: '어디', category: '묻는 말', aliases: ['어디예요','어디에'], status: 'ok',
    원문: '오른 주먹의 1지를 펴서 바닥이 밖으로 향하게 세워 왼쪽으로 흔든 다음, 손바닥이 아래로 향하게 반쯤 구부린 오른손을 가슴 앞에서 약간 내리다가 멈춘다.',
    결합: '어느+곳', hands: 1,
    수형: '검지 → 반쯤 구부린 손', 수향: '검지 바닥이 밖 → 손바닥이 아래', 수위: '가슴 앞', 수동: '검지를 흔든 뒤 손을 내리다 멈춘다', 비수지: '묻는 표정',
    steps: ['검지를 세워 왼쪽으로 흔든다', '반쯤 구부린 손을 손바닥이 아래로 오게 내리다 멈춘다'],
    check: [{ hands: 1, fingers: ['index'], zone: 'chest' }, { hands: 1, zone: 'chest' }] }),

  e(8602, { word: '언제', category: '묻는 말', aliases: ['언제예요','날짜'], status: 'ok',
    원문: '가슴 앞에서 모로 세운 왼손 위에 모로 세운 오른손을 올려놓고 5·1·2·3·4지 순으로 손가락을 접는다.',
    hands: 2, 수형: '편 손 → 차례로 접는 손', 수향: '두 손 모두 엄지가 위로 오게 옆으로 세움', 수위: '가슴 앞', 수동: '엄지부터 새끼까지 차례로 접는다', 비수지: '묻는 표정',
    steps: ['두 손을 엄지가 위로 오게 옆으로 세우고, 오른손을 왼손 위에 올린다', '오른손을 엄지부터 차례로 접는다'],
    check: [{ hands: 2, fingers: ['index','middle','ring','pinky'], zone: 'chest' }, { hands: 2, fingers: [], other: ['index','middle','ring','pinky'], zone: 'chest' }] }),

  e(5394, { word: '누구', category: '묻는 말', aliases: ['누가','누구예요'], status: 'ok',
    원문: '구부린 오른 손가락 등으로 오른뺨을 상하로 두 번 살짝 문지른다.',
    hands: 1, 수형: '구부린 손', 수향: '손가락 등이 뺨', 수위: '오른뺨', 수동: '위아래로 두 번 문지른다', 비수지: '묻는 표정',
    steps: ['구부린 손가락 등으로 오른뺨을 위아래로 두 번 문지른다'],
    check: [{ hands: 1, zone: 'face' }] }),

  e(7713, { word: '왜', category: '묻는 말', aliases: ['어째서','왜요'], status: 'ok',
    원문: '오른 주먹의 1지를 펴서 끝을 오른쪽 관자놀이에 댄 다음, 의문스러운 표정을 짓는다.',
    hands: 1, 수형: '검지만 편 주먹', 수향: '검지 끝이 관자놀이', 수위: '오른쪽 관자놀이', 수동: '댄다', 비수지: '의문스러운 표정',
    steps: ['검지 끝을 오른쪽 관자놀이에 대고 의문스러운 표정을 짓는다'],
    check: [{ hands: 1, fingers: ['index'], zone: 'face' }] }),

  e(7256, { word: '어떻게', category: '묻는 말', aliases: ['어찌'], status: 'ok',
    원문: '오른 주먹의 1지를 펴서 바닥이 밖으로 향하게 세워 왼쪽으로 흔든 다음, 1·2지를 펴서 구부려 세운 두 주먹의 4지 옆면을 두 번 맞부딪친다.',
    결합: '어느+방법', hands: 2,
    수형: '검지 → 검지와 중지를 구부린 두 주먹', 수향: '두 주먹 모두 엄지 쪽이 위로 오게 옆으로 세움', 수위: '가슴 앞', 수동: '검지를 흔든 뒤 두 주먹 새끼 쪽을 두 번 맞부딪친다', 비수지: '묻는 표정',
    steps: ['검지를 세워 왼쪽으로 흔든다', '검지와 중지를 구부린 두 주먹의 새끼 쪽을 두 번 맞부딪친다'],
    check: [{ hands: 1, fingers: ['index'], zone: 'chest' }, { hands: 2, zone: 'chest' }] }),
  e(1352, { word: '학교', category: '생활', aliases: ['학교에','학교는'], status: 'ok',
    원문: '두 손을 펴서 손끝이 위로 손등이 밖으로 향하게 얼굴 앞에 세워 한 번 당긴다.',
    hands: 2, 수형: '두 손 편 손', 수향: '손등이 밖, 손바닥이 얼굴 쪽', 수위: '얼굴 앞', 수동: '한 번 안쪽으로 당긴다',
    steps: ['두 손을 펴서 손등이 밖을 향하게 얼굴 앞에 세운다', '두 손을 얼굴 쪽으로 한 번 당긴다'],
    check: [{ hands: 2, zone: 'face' }, { hands: 2, zone: 'face' }] }),
  e(10419, { word: '먹다', category: '생활', aliases: ['먹어','먹어요','식사'], status: 'ok',
    원문: '오른손을 펴서, 손바닥이 위로 향하게 하여 두 번 입으로 올린다.',
    hands: 1, 수형: '오른손 편 손', 수향: '손바닥이 위', 수위: '입 앞', 수동: '두 번 입으로 올린다',
    steps: ['오른손을 펴 손바닥이 위를 향하게 입 아래에 둔다', '손바닥이 위인 채 입으로 올린다 (두 번 반복)'],
    check: [{ hands: 1, zone: 'chin' }, { hands: 1, zone: 'face' }] }),
  e(7028, { word: '친구', category: '생활', aliases: ['동무','벗'], status: 'ok',
    원문: '두 손을 두 번 맞잡는다.',
    hands: 2, 수형: '서로 맞잡는 두 손', 수향: '손바닥이 서로 마주 봄', 수위: '가슴 앞', 수동: '두 손을 두 번 맞잡는다',
    steps: ['가슴 앞에서 두 손을 마주 보게 벌린다', '두 손을 맞잡는다 (두 번 반복)'],
    check: [{ hands: 2, zone: 'chest' }, { hands: 2, zone: 'chest' }] }),
  e(12165, { word: '만나다', category: '생활', aliases: ['만나요','만나','만남'], status: 'ok',
    원문: '두 주먹의 1지를 펴서 마주 세웠다가 중앙으로 모아 마주 댄다.',
    hands: 2, 수형: '검지만 편 두 주먹', 수향: '두 검지가 마주 봄', 수위: '가슴 앞', 수동: '양옆의 두 검지를 중앙으로 모아 마주 댄다',
    steps: ['두 주먹의 검지만 펴서 양옆에 마주 세운다', '두 손을 중앙으로 모아 세운 검지를 마주 댄다'],
    check: [{ hands: 2, fingers: ['index'], zone: 'chest' }, { hands: 2, fingers: ['index'], zone: 'chest' }] }),
  e(12326, { word: '만들다', category: '생활', aliases: ['만들어','만들어요','만들었어요','짓다','제작','제조','만듦'], status: 'ok',
    원문: '모로 세운 오른 주먹의 밑면으로 모로 세운 왼 주먹의 윗면을 두 번 두드린다.',
    hands: 2, 수형: '두 손 모두 주먹', 수향: '두 주먹 모두 엄지 쪽이 위로 오게 옆으로 세움', 수위: '가슴 앞',
    수동: '위 주먹의 새끼손가락 쪽으로 아래 주먹 윗면을 두 번 두드린다',
    steps: ['두 주먹을 엄지 쪽이 위로 오게 옆으로 세우고, 오른 주먹을 왼 주먹 위로 든다',
            '오른 주먹의 새끼손가락 쪽으로 왼 주먹 윗면을 두드린다 (두 번)'],
    check: [{ hands: 2, fingers: [], zone: 'chest' }, { hands: 2, fingers: [], zone: 'chest' }] }),
  // 2026-11-03 국립국어원 사전 원문·수형 사진 직접 확인
  e(7059, {
  "word": "이름",
  "category": "생활",
  "aliases": [
    "성명",
    "성함",
    "이름이에요"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1·5지를 펴서 끝이 왼쪽으로 향하게 하여 왼쪽 가슴에 1·5지 옆면이 닿게 댄다.",
  "hands": 1,
  "수형": "검지와 엄지만 편 오른 주먹",
  "수향": "손끝이 왼쪽",
  "수위": "왼쪽 가슴",
  "수동": "검지와 엄지 옆면을 왼쪽 가슴에 댄다",
  "steps": [
    "검지와 엄지를 왼쪽으로 펴서 왼쪽 가슴에 옆면을 댄다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "chest",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(11290, {
  "word": "수어",
  "category": "생활",
  "aliases": [
    "수화",
    "수화언어"
  ],
  "status": "ok",
  "원문": "두 주먹의 1지를 펴서 손등이 밖으로 향하게 하여 상하로 나란히 놓고 엇갈리게 돌린다.",
  "hands": 2,
  "수형": "검지만 편 두 주먹",
  "수향": "손등이 밖",
  "수위": "가슴 앞",
  "수동": "상하로 놓은 두 검지를 엇갈리게 돌린다",
  "steps": [
    "검지만 편 두 주먹을 가슴 앞 위아래에 놓는다",
    "두 검지를 엇갈리게 돌려 위아래 위치를 바꾼다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(9131, {
  "word": "배우다",
  "category": "생활",
  "aliases": [
    "배워요",
    "배우고",
    "배웁니다"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 끝이 코로 향하게 구부려 코로 당기는 동작을 두 번 반복한다.",
  "hands": 1,
  "수형": "검지를 펴서 코 쪽으로 구부린 오른 주먹",
  "수향": "검지 끝이 코 쪽",
  "수위": "코 앞",
  "수동": "코 쪽으로 당기는 동작을 두 번 반복한다",
  "steps": [
    "검지를 펴서 끝이 코를 향하도록 구부린다",
    "구부린 검지를 코 쪽으로 당긴다 (두 번 반복)"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face"
    },
    {
      "hands": 1,
      "zone": "face"
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(10964, {
  "word": "병원",
  "category": "생활",
  "aliases": [
    "의원",
    "병원에"
  ],
  "status": "ok",
  "원문": "손등이 밖으로 향하게 편 왼 손등을 오른 주먹의 1·2지를 펴서 끝으로 두 번 두드린 다음, 두손의 손끝을 맞대어 좌우로 비스듬히 세운다.",
  "hands": 2,
  "수형": "오른 검지·중지와 편 왼손 → 두 손 편 손",
  "수향": "왼 손등이 밖 → 두 손 비스듬히",
  "수위": "가슴 앞",
  "수동": "왼 손등을 두 번 두드린 뒤 두 손끝을 지붕처럼 맞댄다",
  "steps": [
    "오른 검지·중지 끝으로 편 왼 손등을 두 번 두드린다",
    "두 손의 손끝을 맞대어 좌우로 비스듬히 세운다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle"
      ],
      "other": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(11796, {
  "word": "가다",
  "category": "생활",
  "aliases": [
    "가요",
    "갑니다",
    "가자",
    "갔어요"
  ],
  "status": "ok",
  "원문": "오른손을 펴서 손등이 밖으로 손끝이 아래로 향하게 하여 내밀며 손끝을 약간 들어 올린다.",
  "hands": 1,
  "수형": "오른손 편 손",
  "수향": "손등이 밖, 손끝이 아래",
  "수위": "몸 앞",
  "수동": "내밀며 손끝을 약간 들어 올린다",
  "steps": [
    "오른손을 펴 손등이 밖으로, 손끝이 아래로 향하게 한다",
    "손을 앞으로 내밀며 손끝을 약간 들어 올린다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "front",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 1,
      "zone": "front",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(7704, {
  "word": "오다",
  "category": "생활",
  "aliases": [
    "와요",
    "옵니다",
    "오세요",
    "왔어요"
  ],
  "status": "ok",
  "원문": "손등이 밖으로 향한 오른 주먹의 1지를 펴서 몸 가까이로 당긴다.",
  "hands": 1,
  "수형": "검지만 편 오른 주먹",
  "수향": "손등이 밖",
  "수위": "몸 앞",
  "수동": "몸 가까이로 당긴다",
  "steps": [
    "오른 주먹의 검지를 펴 몸 앞에 든다",
    "손등이 밖을 향한 채 몸 가까이로 당긴다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "front",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "chest",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(6770, {
  "word": "가족",
  "category": "생활",
  "aliases": [
    "식구"
  ],
  "status": "ok",
  "원문": "두 손의 손끝을 맞대어 좌우로 비스듬히 세운 다음, 왼손은 그대로 두고, 오른손은 주먹을 쥐고 4·5지를 펴서 세워 손목을 좌우로 약간 흔들며 오른쪽으로 약간 이동시킨다.",
  "hands": 2,
  "수형": "두 손 편 손 → 오른 엄지·새끼를 편 주먹",
  "수향": "두 손 비스듬히 → 오른손 세움",
  "수위": "가슴 앞",
  "수동": "손끝을 맞댄 뒤 오른 손목을 흔들며 오른쪽으로 옮긴다",
  "steps": [
    "두 손끝을 맞대어 지붕처럼 비스듬히 세운다",
    "왼손은 그대로 두고 오른 엄지·새끼를 펴 손목을 흔들며 오른쪽으로 조금 옮긴다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "pinky"
      ],
      "other": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(8240, {
  "word": "사랑",
  "category": "생활",
  "aliases": [
    "사랑해요",
    "사랑합니다",
    "사랑하다"
  ],
  "status": "ok",
  "원문": "5지 바닥을 1지 옆면에 대고 손등이 왼쪽으로 향하게 모로 세운 왼 주먹 위에 오른 손바닥을 대고 오른손만 오른쪽으로 돌린다.",
  "hands": 2,
  "수형": "모로 세운 왼 주먹과 편 오른손",
  "수향": "왼 손등이 왼쪽, 오른 손바닥 아래",
  "수위": "가슴 앞",
  "수동": "왼 주먹 위에서 오른손만 오른쪽으로 돌린다",
  "steps": [
    "모로 세운 왼 주먹 위에 오른 손바닥을 댄다",
    "왼 주먹은 그대로 두고 오른손만 오른쪽으로 돌린다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "other": []
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "other": []
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(9543, {
  "word": "잘하다",
  "category": "생활",
  "aliases": [
    "잘",
    "잘해요",
    "잘했어요"
  ],
  "status": "ok",
  "원문": "오른 손바닥으로 왼 팔등을 스쳐 내린다.",
  "hands": 2,
  "수형": "왼 주먹과 편 오른손",
  "수향": "오른 손바닥이 왼 팔등 쪽",
  "수위": "왼팔 위",
  "수동": "오른 손바닥으로 왼 팔등을 스쳐 내린다",
  "steps": [
    "오른 손바닥을 왼 팔꿈치 쪽 팔등에 댄다",
    "왼 팔등을 따라 손목 쪽으로 스쳐 내린다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "front",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "other": []
    },
    {
      "hands": 2,
      "zone": "front",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "other": []
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(8966, {
  "word": "있다",
  "category": "생활",
  "aliases": [
    "있어요",
    "있습니다"
  ],
  "status": "ok",
  "원문": "4·5지를 편 오른 주먹의 5지 끝을 코끝에 댄다.",
  "hands": 1,
  "수형": "엄지와 새끼만 편 오른 주먹",
  "수향": "엄지 끝이 코 쪽",
  "수위": "코끝",
  "수동": "엄지 끝을 코끝에 댄다",
  "steps": [
    "엄지와 새끼를 펴고 엄지 끝을 코끝에 댄다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(9846, {
  "word": "없다",
  "category": "생활",
  "aliases": [
    "없어요",
    "없습니다"
  ],
  "status": "ok",
  "원문": "손끝이 오른쪽으로 향하게 모로 세운 왼 손바닥 안에서 손끝이 왼 손바닥으로 향하게 모로 세운 오른손을 좌우로 움직인다.",
  "hands": 2,
  "수형": "두 손 편 손",
  "수향": "두 손을 모로 세움",
  "수위": "가슴 앞",
  "수동": "왼 손바닥 안에서 오른손을 좌우로 움직인다",
  "steps": [
    "왼손을 모로 세우고 오른 손끝이 왼 손바닥을 향하게 한다",
    "왼 손바닥 안에서 오른손을 좌우로 움직인다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(8214, {
  "word": "엄마",
  "category": "생활",
  "aliases": [
    "어머니",
    "모친"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 끝 바닥을 코 오른쪽에 댔다가 떼며 1지를 접고 4지를 펴서 세운다.",
  "hands": 1,
  "수형": "검지에서 새끼손가락으로 바꿈",
  "수향": "사전 원문 참조",
  "수위": "코 옆에서 오른쪽 어깨 앞",
  "수동": "검지를 코 옆에 댔다 떼며 접고 새끼손가락을 세운다",
  "steps": [
    "오른 검지 끝 바닥을 코 오른쪽에 댄다",
    "손을 떼며 검지를 접고 새끼손가락을 세운다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(2570, {
  "word": "아빠",
  "category": "생활",
  "aliases": [
    "아버지",
    "부친"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 끝을 코 오른쪽에 댔다가 떼며 1지를 접고 5지를 펴서 바닥이 밖으로 향하게 세운다.",
  "hands": 1,
  "수형": "검지에서 엄지로 바꿈",
  "수향": "사전 원문 참조",
  "수위": "코 옆에서 오른쪽 어깨 앞",
  "수동": "검지를 코 옆에 댔다 떼며 접고 엄지를 세운다",
  "steps": [
    "오른 검지 끝을 코 오른쪽에 댄다",
    "손을 떼며 검지를 접고 손바닥이 밖을 향하도록 엄지를 세운다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "face",
      "fingers": [],
      "thumb": "up"
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(7703, {
  "word": "오늘",
  "category": "생활",
  "aliases": [
    "금일"
  ],
  "status": "ok",
  "원문": "두 손을 펴서 손등이 위로 손끝이 밖으로 향하게 하여 가슴 앞에서 약간 아래로 내린다.",
  "hands": 2,
  "수형": "두 손 편 손",
  "수향": "사전 원문 참조",
  "수위": "가슴 앞에서 조금 아래",
  "수동": "두 손을 약간 아래로 내린다",
  "steps": [
    "두 손을 가슴 앞에 펴고 손등은 위로, 손끝은 밖으로 향한다",
    "두 손을 함께 약간 아래로 내린다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 2,
      "zone": "belly",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(12264, {
  "word": "자다",
  "category": "생활",
  "aliases": [
    "잠",
    "수면",
    "자요"
  ],
  "status": "ok",
  "원문": "오른 주먹을 베고 오른쪽으로 약간 기운 자세를 취한다.",
  "hands": 1,
  "수형": "오른 주먹",
  "수향": "사전 원문 참조",
  "수위": "오른쪽 뺨",
  "수동": "오른 주먹을 베고 오른쪽으로 약간 기운다",
  "steps": [
    "오른 주먹을 베고 머리를 오른쪽으로 약간 기울인다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": []
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(6442, {
  "word": "내일",
  "category": "생활",
  "aliases": [
    "명일"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 바닥이 밖으로 향하게 세워 오른쪽 눈 옆에 댔다가 밖으로 내민다.",
  "hands": 1,
  "수형": "검지만 편 오른 주먹",
  "수향": "검지 바닥이 밖을 향함",
  "수위": "오른쪽 눈 옆에서 앞으로",
  "수동": "오른쪽 눈 옆에서 밖으로 내민다",
  "steps": [
    "검지를 펴서 바닥이 밖을 향하게 오른쪽 눈 옆에 세운다",
    "검지를 세운 채 손을 밖으로 내민다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "front",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(8218, {
  "word": "어제",
  "category": "생활",
  "aliases": [
    "어저께",
    "작일"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 세워 오른쪽 어깨 너머로 넘긴다.",
  "hands": 1,
  "수형": "검지만 편 오른 주먹",
  "수향": "검지를 세움",
  "수위": "오른쪽 어깨 너머",
  "수동": "검지를 세운 손을 오른쪽 어깨 너머로 넘긴다",
  "steps": [
    "오른 검지를 펴서 세운다",
    "오른쪽 어깨 너머로 손을 넘긴다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(9694, {
  "word": "우유",
  "category": "생활",
  "aliases": [],
  "status": "ok",
  "원문": "오른손을 펴서 오른쪽 가슴에 대고 두 번 구부렸다 편다.",
  "hands": 1,
  "수형": "오른손을 폈다 구부림",
  "수향": "오른쪽 가슴을 향함",
  "수위": "오른쪽 가슴",
  "수동": "두 번 구부렸다 편다",
  "steps": [
    "오른손을 펴서 오른쪽 가슴에 댄다",
    "손가락을 구부린다 (첫 번째)",
    "손가락을 다시 편다",
    "손가락을 구부린다 (두 번째)",
    "손가락을 다시 편다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 1,
      "zone": "chest",
      "fingers": []
    },
    {
      "hands": 1,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 1,
      "zone": "chest",
      "fingers": []
    },
    {
      "hands": 1,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(8198, {
  "word": "커피",
  "category": "생활",
  "aliases": [],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 끝 바닥을 코에 댄 다음, 그 끝을 둥굴게 구부려 모로 세운 왼손 안에 넣어 돌린다.",
  "hands": 2,
  "수형": "오른 검지를 펴고 끝을 둥글게 구부림·왼손은 모로 세움",
  "수향": "오른 검지 끝이 왼손 안을 향함",
  "수위": "코에서 가슴 앞",
  "수동": "검지 끝 바닥을 코에 댄 뒤 왼손 안에 넣어 돌린다",
  "steps": [
    "오른 검지 끝 바닥을 코에 댄다",
    "검지 끝을 둥글게 구부려 모로 세운 왼손 안에 넣어 돌린다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index"
      ],
      "other": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(6437, {
  "word": "보다",
  "category": "생활",
  "aliases": [
    "봐요",
    "봅니다"
  ],
  "status": "ok",
  "원문": "1지를 펴서 바닥이 안으로 향하게 세운 두 주먹을 상하로 엇갈리게 움직인다.",
  "hands": 2,
  "수형": "두 주먹의 검지를 폄",
  "수향": "검지 바닥이 안쪽",
  "수위": "가슴 앞",
  "수동": "두 손을 상하로 엇갈리게 움직인다",
  "steps": [
    "두 검지를 세워 바닥이 안을 향하게 하고 오른손은 낮게, 왼손은 높게 둔다",
    "오른손을 올리고 왼손을 내려 상하 위치를 바꾼다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(6417, {
  "word": "듣다",
  "category": "생활",
  "aliases": [
    "들어요",
    "듣습니다"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 반쯤 구부려 끝이 오른쪽 귀로 향하게 하여 좌우로 두 번 움직인다.",
  "hands": 1,
  "수형": "오른 검지를 반쯤 구부림",
  "수향": "검지 끝이 오른쪽 귀를 향함",
  "수위": "오른쪽 귀 옆",
  "수동": "좌우로 두 번 움직인다",
  "steps": [
    "오른 검지를 반쯤 구부려 끝이 오른쪽 귀를 향하게 한다",
    "손을 바깥쪽으로 조금 움직인다 (첫 번째)",
    "손을 귀 쪽으로 되돌린다",
    "손을 바깥쪽으로 조금 움직인다 (두 번째)",
    "손을 귀 쪽으로 되돌린다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(8304, {
  "word": "읽다",
  "category": "생활",
  "aliases": [
    "읽기",
    "읽어요",
    "읽습니다"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1·2지를 펴서 끝으로, 손바닥이 위로 손끝이 밖으로 향하게 펴서 비스듬히 세운 왼 손바닥을 두 번 오르내린다.",
  "hands": 2,
  "수형": "오른 검지·중지를 폄, 왼손은 편 손",
  "수향": "왼 손바닥이 위로, 손끝이 밖으로 향함",
  "수위": "가슴 앞",
  "수동": "오른 검지·중지 끝으로 왼 손바닥을 두 번 오르내린다",
  "steps": [
    "왼 손바닥을 비스듬히 세우고 오른 검지·중지 끝을 위쪽에 댄다",
    "두 손가락 끝을 왼 손바닥 아래쪽으로 내린다 (첫 번째)",
    "두 손가락 끝을 다시 위로 올린다",
    "두 손가락 끝을 다시 아래로 내린다 (두 번째)",
    "두 손가락 끝을 다시 위로 올린다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle"
      ],
      "other": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle"
      ],
      "other": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle"
      ],
      "other": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle"
      ],
      "other": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle"
      ],
      "other": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(5947, {
  "word": "물고기",
  "category": "생활",
  "aliases": [
    "생선"
  ],
  "status": "ok",
  "원문": "손끝이 밖으로 향하게 펴서 모로 세운 오른손을 좌우로 움직이며 밖으로 내민다.",
  "hands": 1,
  "수형": "오른손 편 손",
  "수향": "손을 모로 세우고 손끝은 밖으로 향함",
  "수위": "몸 앞",
  "수동": "좌우로 움직이며 밖으로 내민다",
  "steps": [
    "오른손을 펴서 모로 세우고 손끝을 밖으로 향하게 한다",
    "손을 좌우로 움직이며 밖으로 내민다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "front",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 1,
      "zone": "front",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(2231, {
  "word": "아침",
  "category": "생활",
  "aliases": [],
  "status": "ok",
  "원문": "왼손을 손등이 위로 손끝이 오른쪽으로 향하게 하고, 그 밑에서 오른손의 1‧5지 끝을 맞대어 동그라미를 만들어 왼손 안에서 밖으로 약간 올린다.",
  "hands": 2,
  "수형": "오른 검지·엄지 끝으로 고리, 왼손 편 손",
  "수향": "왼 손등 위, 손끝 오른쪽",
  "수위": "왼손 아래에서 위로",
  "수동": "고리를 만든 오른손을 왼손 안에서 밖으로 올린다",
  "steps": [
    "왼손을 가로로 펴고 아래에서 오른 검지·엄지 끝을 맞댄다",
    "고리를 유지하며 오른손을 왼손 안에서 밖으로 약간 올린다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "middle",
        "ring",
        "pinky"
      ],
      "ring": true,
      "other": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "middle",
        "ring",
        "pinky"
      ],
      "ring": true,
      "other": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(11849, {
  "word": "저녁",
  "category": "생활",
  "aliases": [],
  "status": "ok",
  "원문": "오른 주먹의 1·5지를 펴서 가슴 중앙에서 손을 뒤집으며 오른쪽으로 살짝 내린다.",
  "hands": 1,
  "수형": "오른 검지·엄지를 폄",
  "수향": "손을 뒤집음",
  "수위": "가슴 중앙에서 오른쪽 아래",
  "수동": "손을 뒤집으며 오른쪽으로 살짝 내린다",
  "steps": [
    "오른 검지와 엄지를 펴서 가슴 중앙에 둔다",
    "손을 뒤집으며 오른쪽으로 살짝 내린다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "chest",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "front",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(6456, {
  "word": "맛있다",
  "category": "생활",
  "aliases": [
    "맛있어요",
    "맛있습니다",
    "맛나다"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1·5지 옆면을 턱 왼쪽에 댔다가 오른쪽으로 이동시킨다.",
  "hands": 1,
  "수형": "오른 주먹",
  "수향": "검지·엄지 옆면이 턱에 닿음",
  "수위": "턱 왼쪽에서 오른쪽",
  "수동": "턱 왼쪽에서 오른쪽으로 이동시킨다",
  "steps": [
    "오른 주먹의 검지·엄지 옆면을 턱 왼쪽에 댄다",
    "주먹을 턱 오른쪽으로 이동시킨다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "chin",
      "fingers": []
    },
    {
      "hands": 1,
      "zone": "chin",
      "fingers": []
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(9460, {
  "word": "맛없다",
  "category": "생활",
  "aliases": [
    "맛없어요",
    "맛없습니다"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1·5지 옆면을 턱 왼쪽에 댔다가 오른쪽으로 이동시킨 다음, 아래로 내리면서 손가락을 턴다.",
  "hands": 1,
  "수형": "오른 주먹에서 편 손",
  "수향": "검지·엄지 옆면을 턱에 댄 뒤 손가락을 털음",
  "수위": "턱에서 아래로",
  "수동": "턱 왼쪽에서 오른쪽으로 옮긴 뒤 아래로 내리며 손가락을 턴다",
  "steps": [
    "오른 주먹의 검지·엄지 옆면을 턱 왼쪽에 댄다",
    "주먹을 턱 오른쪽으로 이동시킨다",
    "아래로 내리면서 손가락을 턴다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "chin",
      "fingers": []
    },
    {
      "hands": 1,
      "zone": "chin",
      "fingers": []
    },
    {
      "hands": 1,
      "zone": "front",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(6463, {
  "word": "비",
  "category": "날씨",
  "aliases": [
    "강우"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1·5지를 펴서 구부려 입으로 약간 기울여 올린 다음, 두 손을 펴서 손끝이 아래로 손등이 밖으로 향하게 하여 상하로 두 번 움직인다.",
  "hands": 2,
  "수형": "오른 검지·엄지를 구부린 뒤 두 손을 폄",
  "수향": "손끝 아래·손등 밖",
  "수위": "입에서 몸 앞",
  "수동": "입으로 약간 기울여 올린 다음 두 손을 상하로 두 번 움직인다",
  "steps": [
    "오른 검지·엄지를 펴서 구부려 입으로 약간 기울여 올린다",
    "두 손을 펴서 손끝을 아래로, 손등을 밖으로 향하게 들어 올린다",
    "두 손을 내린다 (첫 번째)",
    "두 손을 다시 올린다",
    "두 손을 내린다 (두 번째)"
  ],
  "check": [
    {
      "hands": 1,
      "fingers": [
        "index"
      ],
      "zone": "face"
    },
    {
      "hands": 2,
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "zone": "face"
    },
    {
      "hands": 2,
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "zone": "chest"
    },
    {
      "hands": 2,
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "zone": "face"
    },
    {
      "hands": 2,
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "zone": "chest"
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(6211, {
  "word": "빨강",
  "category": "색깔",
  "aliases": [
    "빨갛다",
    "빨간색",
    "빨강색",
    "적색"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 옆면으로 입술 밑을 오른쪽으로 스쳐 낸다.",
  "hands": 1,
  "수형": "오른 검지",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "입술 밑",
  "수동": "오른쪽으로 스쳐 냄",
  "steps": [
    "오른 검지를 펴서 옆면을 입술 밑에 댄다",
    "검지 옆면으로 입술 밑을 오른쪽으로 스쳐 낸다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(103, {
  "word": "파랑",
  "category": "색깔",
  "aliases": [
    "파랗다",
    "파란색",
    "파랑색",
    "청색"
  ],
  "status": "ok",
  "원문": "오른 손바닥으로 오른뺨을 스쳐 내린다.",
  "hands": 1,
  "수형": "오른 편 손",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "오른뺨",
  "수동": "아래로 스쳐 내림",
  "steps": [
    "오른 손바닥을 오른뺨에 댄다",
    "오른뺨을 손바닥으로 스쳐 내린다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(12177, {
  "word": "노랑",
  "category": "색깔",
  "aliases": [
    "노랗다",
    "노란색",
    "노랑색"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 끝으로 치아를 스쳐 낸다.",
  "hands": 1,
  "수형": "오른 검지",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "치아",
  "수동": "치아를 스쳐 냄",
  "steps": [
    "오른 검지를 펴서 끝을 치아에 댄다",
    "검지 끝으로 치아를 스쳐 낸다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    },
    {
      "hands": 1,
      "zone": "front",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(6875, {
  "word": "검정",
  "category": "색깔",
  "aliases": [
    "검다",
    "검은색",
    "검정색",
    "까맣다"
  ],
  "status": "ok",
  "원문": "오른 손바닥으로 머리 오른쪽을 스쳐 내린다.",
  "hands": 1,
  "수형": "오른 편 손",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "머리 오른쪽",
  "수동": "아래로 스쳐 내림",
  "steps": [
    "오른 손바닥을 머리 오른쪽에 댄다",
    "머리 오른쪽을 손바닥으로 스쳐 내린다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(3024, {
  "word": "하양",
  "category": "색깔",
  "aliases": [
    "하얗다",
    "하얀색",
    "흰색",
    "백색"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 끝으로 치아를 가리킨다.",
  "hands": 1,
  "수형": "오른 검지",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "치아",
  "수동": "치아를 가리킴",
  "steps": [
    "오른 검지를 펴서 끝으로 치아를 가리킨다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face",
      "fingers": [
        "index"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(6492, {
  "word": "덥다",
  "category": "생활",
  "aliases": [
    "더워요",
    "덥습니다",
    "더위"
  ],
  "status": "ok",
  "원문": "두 손의 손가락을 자연스럽게 벌려 펴서 바닥이 아래로 향하게 하여 머리 양옆에서 동시에 두 번 상하로 흔든다.",
  "hands": 2,
  "수형": "두 편 손",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "머리 양옆",
  "수동": "동시에 상하로 흔듦",
  "steps": [
    "손가락을 자연스럽게 벌리고 손바닥이 아래로 향하게 머리 양옆에 둔다",
    "두 손을 동시에 상하로 흔든다 (두 번)"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "face",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ]
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(9670, {
  "word": "춥다",
  "category": "생활",
  "aliases": [
    "추워요",
    "춥습니다",
    "추위"
  ],
  "status": "ok",
  "원문": "두 주먹을 가슴 앞으로 올려 떠는 동작을 한다.",
  "hands": 2,
  "수형": "두 주먹",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "가슴 앞",
  "수동": "떠는 동작",
  "steps": [
    "두 주먹을 가슴 앞으로 올려 떠는 동작을 한다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": []
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(498, {
  "word": "포도",
  "category": "생활",
  "aliases": [],
  "status": "ok",
  "원문": "두 손 각각 1·5지 끝을 맞대어 동그라미를 만들어 상하로 엇갈리게 흔든다.",
  "hands": 2,
  "수형": "두 손의 검지·엄지 고리",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "가슴 앞",
  "수동": "상하로 엇갈리게 흔듦",
  "steps": [
    "두 손의 검지·엄지 끝을 맞대어 고리를 만들고 높이를 엇갈리게 둔다",
    "고리를 유지하며 두 손을 상하로 엇갈리게 흔든다"
  ],
  "check": [
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "middle",
        "ring",
        "pinky"
      ],
      "ring": true
    },
    {
      "hands": 2,
      "zone": "chest",
      "fingers": [
        "middle",
        "ring",
        "pinky"
      ],
      "ring": true
    }
  ],
  "sourceCheckedAt": "2026-11-03",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(11829, {
  "word": "칭찬하다",
  "category": "감정",
  "aliases": [
    "칭찬",
    "칭찬해",
    "칭찬해요"
  ],
  "status": "ok",
  "원문": "5지를 펴서 세운 왼 주먹을 오른 손바닥으로 두 번 쳐 올린다.",
  "hands": 2,
  "수형": "사전 원문과 단계 설명 참조",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "가슴 앞",
  "수동": "5지를 펴서 세운 왼 주먹을 오른 손바닥으로 두 번 쳐 올린다.",
  "steps": [
    "엄지를 세운 왼 주먹 아래에 오른 손바닥을 위로 향하게 둔다",
    "오른 손바닥으로 왼 주먹을 쳐 올린다 (두 번)"
  ],
  "check": [
    {
      "hands": 2,
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "other": [],
      "zone": "chest"
    },
    {
      "hands": 2,
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "other": [],
      "zone": "chest"
    }
  ],
  "sourceCheckedAt": "2026-11-04",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(11501, {
  "word": "열심히",
  "category": "감정",
  "aliases": [
    "열심"
  ],
  "status": "ok",
  "원문": "5지를 펴서 세운 두 주먹을 배 양쪽에 댔다가 힘주어 밖으로 내민다.",
  "hands": 2,
  "수형": "사전 원문과 단계 설명 참조",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "배 양쪽 → 몸 앞",
  "수동": "5지를 펴서 세운 두 주먹을 배 양쪽에 댔다가 힘주어 밖으로 내민다.",
  "steps": [
    "엄지를 세운 두 주먹을 배 양쪽에 댄다",
    "두 주먹을 힘주어 앞으로 내민다"
  ],
  "check": [
    {
      "hands": 2,
      "fingers": [],
      "thumb": "up",
      "zone": "belly"
    },
    {
      "hands": 2,
      "fingers": [],
      "thumb": "up",
      "zone": "front"
    }
  ],
  "sourceCheckedAt": "2026-11-04",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(10730, {
  "word": "시끄럽다",
  "category": "감정",
  "aliases": [
    "시끄러워",
    "시끄러워요",
    "소음"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 반쯤 구부려 오른쪽 귀 가까이에서 좌우로 두 번 움직인 다음, 반쯤 구부린 두 손을 상하로 마주 보게 하여 엇갈리게 돌린다.",
  "hands": 2,
  "수형": "사전 원문과 단계 설명 참조",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "귀 옆 → 몸 앞",
  "수동": "오른 주먹의 1지를 펴서 반쯤 구부려 오른쪽 귀 가까이에서 좌우로 두 번 움직인 다음, 반쯤 구부린 두 손을 상하로 마주 보게 하여 엇갈리게 돌린다.",
  "steps": [
    "오른 검지를 반쯤 구부려 귀 가까이에서 좌우로 움직인다 (두 번)",
    "반쯤 구부린 두 손을 위아래로 마주 보게 하여 엇갈리게 돌린다"
  ],
  "check": [
    {
      "hands": 1,
      "zone": "face"
    },
    {
      "hands": 2,
      "zone": "chest"
    }
  ],
  "sourceCheckedAt": "2026-11-04",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(6043, {
  "word": "짜증",
  "category": "감정",
  "aliases": [
    "짜증나다",
    "짜증나요",
    "짜증나"
  ],
  "status": "ok",
  "원문": "오른 주먹의 1지를 펴서 바닥이 밖으로 향하게 세워 머리 오른쪽에 대고 두 번 오르내린다.",
  "hands": 1,
  "수형": "사전 원문과 단계 설명 참조",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "머리 오른쪽",
  "수동": "오른 주먹의 1지를 펴서 바닥이 밖으로 향하게 세워 머리 오른쪽에 대고 두 번 오르내린다.",
  "steps": [
    "오른 검지만 펴서 손바닥이 밖을 향하게 머리 오른쪽에 세운다",
    "손 모양을 유지하며 머리 오른쪽에서 오르내린다 (두 번)"
  ],
  "check": [
    {
      "hands": 1,
      "fingers": [
        "index"
      ],
      "zone": "face"
    },
    {
      "hands": 1,
      "fingers": [
        "index"
      ],
      "zone": "face"
    }
  ],
  "sourceCheckedAt": "2026-11-04",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(39, {
  "word": "그만",
  "category": "감정",
  "aliases": [
    "그만이다",
    "그만해",
    "그만해요"
  ],
  "status": "ok",
  "원문": "손끝이 밖으로 향하게 펴서 모로 세운 왼 손바닥에 오른 손끝을 두 번 가져다 댄다.",
  "hands": 2,
  "수형": "사전 원문과 단계 설명 참조",
  "수향": "사전 원문과 단계 설명 참조",
  "수위": "가슴 앞",
  "수동": "손끝이 밖으로 향하게 펴서 모로 세운 왼 손바닥에 오른 손끝을 두 번 가져다 댄다.",
  "steps": [
    "왼손을 손끝이 밖을 향하게 모로 세우고 오른 손끝을 가까이 둔다",
    "오른 손끝을 왼 손바닥에 가져다 댄다 (두 번)"
  ],
  "check": [
    {
      "hands": 2,
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "zone": "chest"
    },
    {
      "hands": 2,
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "zone": "chest"
    }
  ],
  "sourceCheckedAt": "2026-11-04",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(9351, {
  "word": "조용하다",
  "category": "감정",
  "aliases": [
    "조용해",
    "조용해요",
    "조용히"
  ],
  "status": "ok",
  "원문": "두 손을 펴서 손바닥이 위로 향하게 하고 손끝이 마주 보게 하여 천천히 아래로 내린다.",
  "hands": 2,
  "수형": "편 두 손",
  "수향": "손바닥 위, 손끝이 마주 봄",
  "수위": "가슴 앞 → 배 앞",
  "수동": "두 손을 펴서 손바닥이 위로 향하게 하고 손끝이 마주 보게 하여 천천히 아래로 내린다.",
  "steps": [
    "두 손을 펴서 손바닥을 위로 향하게 하고 손끝을 마주 보게 둔다",
    "손바닥 방향을 유지하며 두 손을 천천히 아래로 내린다"
  ],
  "check": [
    {
      "hands": 2,
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "zone": "chest"
    },
    {
      "hands": 2,
      "fingers": [
        "index",
        "middle",
        "ring",
        "pinky"
      ],
      "zone": "belly"
    }
  ],
  "sourceCheckedAt": "2026-11-04",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(4322, {
  "word": "귀찮다",
  "category": "감정",
  "aliases": [
    "귀찮아",
    "귀찮아요"
  ],
  "status": "ok",
  "원문": "오른손의 손가락을 구부려 끝을, 주먹을 쥔 왼팔 등에 대고 손목 등 쪽으로 두 번 스쳐낸다.",
  "hands": 2,
  "수형": "왼손 주먹, 오른손 손가락 구부림",
  "수향": "오른 손가락 끝이 왼 팔등에 닿음",
  "수위": "왼 팔등 → 왼 손목 등",
  "수동": "오른손의 손가락을 구부려 끝을, 주먹을 쥔 왼팔 등에 대고 손목 등 쪽으로 두 번 스쳐낸다.",
  "steps": [
    "왼 주먹을 쥐고 왼팔 등에 구부린 오른 손가락 끝을 댄다",
    "오른 손가락 끝을 왼 손목 등 쪽으로 스쳐낸다 (두 번)"
  ],
  "check": [
    {
      "hands": 2,
      "other": [],
      "zone": "belly"
    },
    {
      "hands": 2,
      "other": [],
      "zone": "belly"
    }
  ],
  "sourceCheckedAt": "2026-11-04",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
  e(12013, {
  "word": "부끄럽다",
  "category": "감정",
  "aliases": [
    "부끄러워",
    "부끄러워요",
    "수줍다",
    "수줍어요",
    "창피하다",
    "창피해요"
  ],
  "status": "ok",
  "원문": "오른손의 1·5지 끝을 맞대어 동그라미를 만들어 세워 등을 오른쪽 볼에 두 번 댔다 뗀다.",
  "hands": 1,
  "수형": "오른 검지·엄지 고리, 나머지 손가락 펴기",
  "수향": "손등이 오른쪽 볼에 닿음",
  "수위": "오른쪽 볼",
  "수동": "오른손의 1·5지 끝을 맞대어 동그라미를 만들어 세워 등을 오른쪽 볼에 두 번 댔다 뗀다.",
  "steps": [
    "오른 검지·엄지 끝으로 고리를 만들어 세우고 손등을 오른쪽 볼에 댄다",
    "고리 모양을 유지하며 오른쪽 볼에 댔다 뗀다 (두 번)"
  ],
  "check": [
    {
      "hands": 1,
      "fingers": [
        "middle",
        "ring",
        "pinky"
      ],
      "ring": true,
      "zone": "face"
    },
    {
      "hands": 1,
      "fingers": [
        "middle",
        "ring",
        "pinky"
      ],
      "ring": true,
      "zone": "face"
    }
  ],
  "sourceCheckedAt": "2026-11-04",
  "illustrationReview": "사전 원문·수형 사진 대조, 수어 전문가 검수 전"
}),
];

/* 사전에서 찾지 못한 것 — 따로 표제어가 없다. 가리키는 동작으로 대신 쓰인다. */
export const NOT_IN_DICTIONARY = ['저것', '저기', '거기', '그것'];
