import React, {useState, useContext} from "react";


const AuthenticationContext = React.createContext({
	username: "",
	password: "",
	token: "",
	isLoggedIn: false,
	login: (u: string, p: string, t: string) => {},
	logout: () => {}
});

export function useAuthentication()
{
	return useContext(AuthenticationContext);
}

export function AuthenticationProvider({children}: React.PropsWithChildren<{}>) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [token,    setToken]    = useState("");
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	function login(u: string, p: string, t: string) {
		setUsername(u);
		setPassword(p);
		setToken(t);
		setIsLoggedIn(true); // after setting username and password, because it activates the queries
	}

	function logout() {
		setIsLoggedIn(false);
		setUsername("");
		setPassword("");
		setToken("");
	}

	return (
		<AuthenticationContext.Provider value={{username, password, token, isLoggedIn, login, logout}}>
			{children}
		</AuthenticationContext.Provider>
	);
}

