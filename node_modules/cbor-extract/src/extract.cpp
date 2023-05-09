/*
This is responsible for extracting the strings, in bulk, from a CBOR buffer. Creating strings from buffers can
be one of the biggest performance bottlenecks of parsing, but creating an array of extracting strings all at once
provides much better performance. This will parse and produce up to 256 strings at once .The JS parser can call this multiple
times as necessary to get more strings. This must be partially capable of parsing CBOR so it can know where to
find the string tokens and determine their position and length. All strings are decoded as UTF-8.
*/
#include <node_api.h>
#if ENABLE_V8_API
#include <v8.h>
#endif

#ifndef thread_local
#ifdef __GNUC__
# define thread_local __thread
#elif __STDC_VERSION__ >= 201112L
# define thread_local _Thread_local
#elif defined(_MSC_VER)
# define thread_local __declspec(thread)
#else
# define thread_local
#endif
#endif

const int MAX_TARGET_SIZE = 255;
napi_value unexpectedEnd(napi_env env) {
	napi_value returnValue;
	napi_get_undefined(env, &returnValue);
	napi_throw_type_error(env, NULL, "Unexpected end of buffer reading string");
	return returnValue;
}
class Extractor {
public:
	napi_value target[MAX_TARGET_SIZE + 1]; // leave one for the queued string

	uint8_t* source;
	int position = 0;
	int writePosition = 0;
	int stringStart = 0;
	int lastStringEnd = 0;

	void readString(napi_env env, int length, bool allowStringBlocks) {
		int start = position;
		int end = position + length;
		if (allowStringBlocks) { // for larger strings, we don't bother to check every character for being latin, and just go right to creating a new string
			while(position < end) {
				if (source[position] < 0x80) // ensure we character is latin and can be decoded as one byte
					position++;
				else {
					break;
				}
			}
		}
		if (position < end) {
			// non-latin character
			if (lastStringEnd) {
				napi_value value;
				napi_create_string_latin1(env, (const char*) source + stringStart, lastStringEnd - stringStart, &value);
				target[writePosition++] = value;
				lastStringEnd = 0;
			}
			// use standard utf-8 conversion
			napi_value value;
			napi_create_string_utf8(env, (const char*) source + start, (int) length, &value);
			target[writePosition++] = value;
			position = end;
			return;
		}

		if (lastStringEnd) {
			if (start - lastStringEnd > 40 || end - stringStart > 6000) {
				napi_value value;
				napi_create_string_latin1(env, (const char*) source + stringStart, lastStringEnd - stringStart, &value);
				target[writePosition++] = value;
				stringStart = start;
			}
		} else {
			stringStart = start;
		}
		lastStringEnd = end;
	}
	napi_value extractStrings(napi_env env, int startingPosition, int size, int firstStringSize, uint8_t* inputSource) {
		writePosition = 0;
		lastStringEnd = 0;
		position = startingPosition;
		source = inputSource;
		readString(env, firstStringSize, firstStringSize < 0x100);
		while (position < size) {
			uint8_t token = source[position++];
			uint8_t majorType = token >> 5;
			token = token & 0x1f;
			if (majorType == 2 || majorType == 3) {
				int length;
				switch (token) {
					case 0x18:
						if (position + 1 > size) {
							return unexpectedEnd(env);
						}
						length = source[position++];
						break;
					case 0x19:
						if (position + 2 > size) {
							return unexpectedEnd(env);
						}
						length = source[position++] << 8;
						length += source[position++];
						break;
					case 0x1a:
						if (position + 4 > size) {
							return unexpectedEnd(env);
						}
						length = source[position++] << 24;
						length += source[position++] << 16;
						length += source[position++] << 8;
						length += source[position++];
						break;
					case 0x1b:
						return unexpectedEnd(env);
					default:
						length = token;
				}
				if (majorType == 3) {
					// string
					if (length + position > size) {
						return unexpectedEnd(env);
					}
					readString(env, length, length < 0x100);
					if (writePosition >= MAX_TARGET_SIZE)
						break;
				} else { // binary data
					position += length;
				}

			} else { // all other tokens
				switch (token) {
					case 0x18:
						position++;
						break;
					case 0x19:
						position += 2;
						break;
					case 0x1a:
						position += 4;
						break;
					case 0x1b:
						position += 8;
						break;
				}
			}
		}
		if (lastStringEnd) {
			napi_value value;
			napi_create_string_latin1(env, (const char*) source + stringStart, lastStringEnd - stringStart, &value);
			if (writePosition == 0) {
				return value;
			}
			target[writePosition++] = value;
		} else if (writePosition == 1) {
			return target[0];
		}
		napi_value array;
		#if ENABLE_V8_API
		v8::Local<v8::Array> v8Array = v8::Array::New(v8::Isolate::GetCurrent(), (v8::Local<v8::Value>*) target, writePosition);
		memcpy(&array, &v8Array, sizeof(array));
		#else
		napi_create_array_with_length(env, writePosition, &array);
		for (int i = 0; i < writePosition; i++) {
			napi_set_element(env, array, i, target[i]);
		}
		#endif
		return array;
	}
};

static thread_local Extractor* extractor;

napi_value extractStrings(napi_env env, napi_callback_info info) {
	size_t argc = 4;
	napi_value args[4];
	napi_get_cb_info(env, info, &argc, args, NULL, NULL);
	uint32_t position;
	uint32_t size;
	uint32_t firstStringSize;
	napi_get_value_uint32(env, args[0], &position);
	napi_get_value_uint32(env, args[1], &size);
	napi_get_value_uint32(env, args[2], &firstStringSize);
	uint8_t* source;
	size_t buffer_size;
	napi_get_buffer_info(env, args[3], (void**) &source, &buffer_size);
	return extractor->extractStrings(env, position, size, firstStringSize, source);
}
#define EXPORT_NAPI_FUNCTION(name, func) { napi_property_descriptor desc = { name, 0, func, 0, 0, 0, (napi_property_attributes) (napi_writable | napi_configurable), 0 }; napi_define_properties(env, exports, 1, &desc); }

NAPI_MODULE_INIT() {
	extractor = new Extractor(); // create our thread-local extractor
	EXPORT_NAPI_FUNCTION("extractStrings", extractStrings);
	return exports;
}