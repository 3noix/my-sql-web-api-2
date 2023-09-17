export class Credentials {
	private _username = "";
	private _password = "";
	private _token = "";
	private _isLoggedIn = false;

	public constructor() {}

	public username() {return this._username;}
	public token() {return this._token;}
	public isLoggedIn() {return this._isLoggedIn;}

	public login(u: string, p: string, t: string) {
		this._username = u;
		this._password = p;
		this._token = t;
		this._isLoggedIn = true;
	}

	public logout() {
		this._isLoggedIn = false;
		this._username = "";
		this._password = "";
		this._token = "";
	}
}
