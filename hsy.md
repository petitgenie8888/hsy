import streamlit as st

# 1. 웹앱 초기 상태(Session State) 설정
if "topic" not in st.session_state:
    st.session_state.topic = "인공지능(AI)에게 법적·도덕적 책임을 부여해야 하는가?"
if "opinions" not in st.session_state:
    st.session_state.opinions = [
        {"id": 1, "type": "찬성", "content": "AI가 자율적으로 내린 결정으로 피해가 발생했다면, AI 자체에 책임을 묻는 제도가 필요합니다.", "comments": ["그 책임은 결국 개발자가 져야 하는 것 아닐까요?"]},
        {"id": 2, "type": "반대", "content": "AI는 인간이 프로그래밍한 도구에 불과하므로 도덕적 주체가 될 수 없습니다.", "comments": ["학습 데이터에 따라 스스로 진화하는 AI도 도구로만 볼 수 있을까요?"]}
    ]
if "admin_authenticated" not in st.session_state:
    st.session_state.admin_authenticated = False
if "student_logged_in" not in st.session_state:
    st.session_state.student_logged_in = False
if "student_id" not in st.session_state:
    st.session_state.student_id = ""

st.set_page_config(page_title="현대사회와 윤리 토론방", layout="wide")
st.title("🎓 2022 개정 교육과정: 현대사회와 윤리 토론방")

# 2. 사용자 모드 선택 (사이드바)
menu = st.sidebar.radio("접속 권한 선택", ["학생 모드", "교사(관리자) 모드"])

# --- 교사(관리자) 모드 로직 ---
if menu == "교사(관리자) 모드":
    st.sidebar.subheader("🔒 관리자 인증")
    auth_code = st.sidebar.text_input("인증 코드를 입력하세요", type="password")
    
    if auth_code == "t777": # 임시 인증 코드
        st.session_state.admin_authenticated = True
        st.sidebar.success("인증되었습니다.")
    elif auth_code:
        st.sidebar.error("코드가 올바르지 않습니다.")
        st.session_state.admin_authenticated = False

    st.header("📝 쟁점 관리 및 발제")
    if st.session_state.admin_authenticated:
        new_topic = st.text_area("새로운 토론 쟁점을 제시하세요:", value=st.session_state.topic)
        if st.button("쟁점 업데이트 & 토론방 초기화"):
            st.session_state.topic = new_topic
            st.session_state.opinions = [] # 새 쟁점 발제 시 기존 토론 초기화
            st.success("새로운 쟁점이 반영되었습니다!")
            st.rerun()
    else:
        st.warning("교사 모드를 사용하려면 사이드바에서 올바른 인증 코드를 입력하세요.")

# --- 학생 모드 로직 ---
else:
    st.header("✍️ 학생 참여 공간")
    if not st.session_state.student_logged_in:
        student_id_input = st.text_input("자신의 학번을 입력하세요 (예: 30101):")
        if st.button("토론방 입장"):
            if student_id_input.strip():
                st.session_state.student_id = student_id_input
                st.session_state.student_logged_in = True
                st.rerun()
            else:
                st.error("학번을 올바르게 입력해주세요.")
    else:
        st.info(f"정상 입장되었습니다. [학번: {st.session_state.student_id}]")
        if st.button("로그아웃/학번 변경"):
            st.session_state.student_logged_in = False
            st.session_state.student_id = ""
            st.rerun()

        # 의견 작성 폼
        st.subheader("📢 내 입장 제출하기")
        with st.form("opinion_form", clear_on_submit=True):
            side = st.radio("나의 입장:", ["찬성", "반대"])
            reason = st.text_area("그렇게 생각하는 구체적인 이유를 작성하세요:")
            submitted = st.form_submit_button("포스트잇 등록")
            
            if submitted:
                if reason.strip():
                    new_op = {
                        "id": len(st.session_state.opinions) + 1,
                        "type": side,
                        "content": reason,
                        "comments": []
                    }
                    st.session_state.opinions.append(new_op)
                    st.success("의견이 익명 포스트잇으로 등록되었습니다.")
                    st.rerun()
                else:
                    st.error("이유를 작성하셔야 등록이 가능합니다.")

# 3. 메인 토론 광장 (쟁점 및 포스트잇 시각화)
st.markdown("---")
st.subheader(f"🔥 현재 토론 쟁점")
st.info(f"### {st.session_state.topic}")

# 찬성 / 반대 섹션 분할 시각화
col1, col2 = st.columns(2)

with col1:
    st.markdown("### 🔵 찬성 의견")
    for op in st.session_state.opinions:
        if op["type"] == "찬성":
            with st.container(border=True):
                # 포스트잇 느낌을 위한 텍스트 스타일링
                st.markdown(f"📌 **익명 의견**")
                st.write(op["content"])
                
                # 댓글(반론) 리스트 표시
                if op["comments"]:
                    st.markdown("**↳ 반론 및 댓글:**")
                    for cm in op["comments"]:
                        st.caption(f"💬 {cm}")
                
                # 댓글 작성 기능 (로그인한 학생이나 인증된 교사만 가능)
                if st.session_state.student_logged_in or st.session_state.admin_authenticated:
                    comment_input = st.text_input(f"반론 작성 (포스트잇 #{op['id']})", key=f"add_cm_{op['id']}")
                    if st.button(f"댓글 등록", key=f"btn_cm_{op['id']}"):
                        if comment_input.strip():
                            op["comments"].append(comment_input)
                            st.rerun()

with col2:
    st.markdown("### 🔴 반대 의견")
    for op in st.session_state.opinions:
        if op["type"] == "반대":
            with st.container(border=True):
                st.markdown(f"📌 **익명 의견**")
                st.write(op["content"])
                
                if op["comments"]:
                    st.markdown("**↳ 반론 및 댓글:**")
                    for cm in op["comments"]:
                        st.caption(f"💬 {cm}")
                
                if st.session_state.student_logged_in or st.session_state.admin_authenticated:
                    comment_input = st.text_input(f"반론 작성 (포스트잇 #{op['id']})", key=f"add_cm_{op['id']}")
                    if st.button(f"댓글 등록", key=f"btn_cm_{op['id']}"):
                        if comment_input.strip():
                            op["comments"].append(comment_input)
                            st.rerun()