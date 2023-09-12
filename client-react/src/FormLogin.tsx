import {useRef} from "react";
import {useAuthentication} from "./useAuthentication";
import styled from "styled-components";
import "./FormLogin.scss";


const Overlay = styled.div`
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	background: rgba(0,0,0,0.5);
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
`;


export default function FormLogin() {
	const auth = useAuthentication();
	const loginRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);

	const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = event => {
		if (event.key === "Enter") {
			onOkClicked();
		}
	};

	const onOkClicked = async () => {
		const username = loginRef.current?.value || "";
		const password = passwordRef.current?.value || "";

		if (username.length <= 2 || password.length <= 2) {
			alert(`Authentication failed!`);
			return;
		}

		auth.login(username, password);
	}

	return (
		<Overlay>
			<form className="login">
				<div className="for-field">
					<label htmlFor="username">User name:</label>
					<input name="username" id="username"
						type="text"
						onKeyDown={onKeyDown}
						ref={loginRef}
						autoFocus
					/>
				</div>
				<div className="for-field">
					<label htmlFor="password">Password:</label>
					<input name="password" id="password"
						type="password"
						onKeyDown={onKeyDown}
						ref={passwordRef}
					/>
				</div>
				<div className="for-buttons">
					<button type="button" id="ok" onClick={onOkClicked}>Connect</button>
				</div>
			</form>
		</Overlay>
	);
}

